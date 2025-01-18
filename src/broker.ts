import amqp, { Connection, Channel, Message, Options } from "amqplib";
import EventEmitter from "events";

/**
 * RabbitMQBroker
 * A singleton class to manage RabbitMQ connections, channels, and messaging.
 * Includes support for dead-letter queues, error handling, and EventEmitter for external integrations.
 */
class RabbitMQBroker extends EventEmitter {
  private static instance: RabbitMQBroker;
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private constructor() {
    super(); // Initialize EventEmitter
  }

  /**
   * Gets the singleton instance of the RabbitMQBroker.
   * @returns RabbitMQBroker instance.
   */
  public static getInstance(): RabbitMQBroker {
    if (!RabbitMQBroker.instance) {
      RabbitMQBroker.instance = new RabbitMQBroker();
    }
    return RabbitMQBroker.instance;
  }

  /**
   * Initializes the RabbitMQ connection and channel.
   * Emits an "error" event if the connection or channel fails.
   * @param url - The RabbitMQ connection URL.
   * @throws Error if the connection URL is invalid or connection fails.
   */
  public async init(url: string): Promise<void> {
    if (!url) {
      this.emit("error", new Error("RabbitMQ connection URL is undefined."));
      return;
    }

    const sanitizedUrl = url.trim();
    console.log("Connecting to RabbitMQ with sanitized URL:", sanitizedUrl);

    try {
      this.connection = await amqp.connect(sanitizedUrl);
      this.connection.on("close", () => {
        console.error("RabbitMQ connection closed.");
        this.emit("connectionClosed");
        this.connection = null;
        this.channel = null;
      });

      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ connection and channel established.");
    } catch (err) {
      console.error("Failed to connect to RabbitMQ:", err);
      this.emit("error", err);
      throw err; // Optionally rethrow to handle at the caller level
    }
  }

  /**
   * Ensures that the channel is available.
   * Re-establishes the channel if it is closed.
   * @returns The RabbitMQ channel.
   * @throws Error if the channel cannot be initialized.
   */
  private async ensureChannel(): Promise<Channel> {
    if (!this.channel && this.connection) {
      console.warn("Re-establishing RabbitMQ channel...");
      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ channel re-established.");
    }
    if (!this.channel) {
      const error = new Error("RabbitMQ channel is not initialized.");
      this.emit("error", error);
      throw error;
    }
    return this.channel;
  }

  /**
   * Publishes a message directly to a specified queue.
   * @param queue - The queue name.
   * @param message - The message to publish.
   * @param options - Additional publish options.
   */
  public async publish(
    queue: string,
    message: Buffer | string,
    options: Options.Publish = {}
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(
        queue,
        Buffer.isBuffer(message) ? message : Buffer.from(message),
        options
      );
      console.log(`Message published to queue: ${queue}`);
    } catch (err) {
      console.error("Failed to publish message to queue:", err);
      this.emit("error", err);
    }
  }

  /**
   * Publishes a message to a specified exchange with a routing key.
   * @param exchange - The exchange name.
   * @param routingKey - The routing key.
   * @param message - The message to publish.
   * @param type - The type of the exchange (default: "topic").
   * @param options - Additional publish options.
   */
  public async publishToExchange(
    exchange: string,
    routingKey: string,
    message: Buffer | string,
    type: "direct" | "topic" | "fanout" | "headers" = "topic",
    options: Options.Publish = {}
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.assertExchange(exchange, type, { durable: true });
      channel.publish(
        exchange,
        routingKey,
        Buffer.isBuffer(message) ? message : Buffer.from(message),
        options
      );
      console.log(
        `Message published to exchange: ${exchange}, routingKey: ${routingKey}, type: ${type}`
      );
    } catch (err) {
      console.error("Failed to publish message to exchange:", err);
      this.emit("error", err);
    }
  }

  /**
   * Asserts an exchange.
   * Ensures that the specified exchange exists, creating it if necessary.
   * @param exchange - The name of the exchange.
   * @param type - The type of the exchange (e.g., "direct", "topic").
   * @param options - Options to configure the exchange.
   * @throws Error if the channel is not initialized or if assertion fails.
   */
  public async assertExchange(
    exchange: string,
    type: "direct" | "topic" | "fanout" | "headers",
    options: Options.AssertExchange = { durable: true }
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.assertExchange(exchange, type, options);
      console.log(`Exchange asserted: ${exchange}`);
    } catch (err) {
      console.error(`Failed to assert exchange: ${exchange}`, err);
      this.emit("error", err);
    }
  }

  /**
   * Sets up a queue with optional arguments.
   * @param queue - The queue name.
   * @param options - Queue options.
   */
  public async setupQueue(
    queue: string,
    options: Options.AssertQueue = {}
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.assertQueue(queue, options);
      console.log(`Queue set up: ${queue}`);
    } catch (err) {
      console.error(`Failed to set up queue: ${queue}`, err);
      this.emit("error", err);
    }
  }

  /**
   * Binds a queue to an exchange with a routing key.
   * @param queue - The queue name.
   * @param exchange - The exchange name.
   * @param routingKey - The routing key.
   */
  public async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.bindQueue(queue, exchange, routingKey);
      console.log(
        `Queue "${queue}" bound to exchange "${exchange}" with routing key "${routingKey}"`
      );
    } catch (err) {
      console.error("Failed to bind queue:", err);
      this.emit("error", err);
    }
  }

  /**
   * Sets up a dead-letter queue (DLQ) and binds it to the main queue.
   * @param queue - The primary queue name.
   * @param dlx - The dead-letter exchange name.
   * @param dlq - The dead-letter queue name.
   * @param dlxType - The type of the dead-letter exchange (default: "topic").
   * @param dlqRoutingKey - The routing key for dead-lettered messages (default: "#").
   */
  public async setupDeadLetterQueue(
    queue: string,
    dlx: string,
    dlq: string,
    dlxType: "direct" | "topic" | "fanout" | "headers" = "topic",
    dlqRoutingKey: string = "#"
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.assertExchange(dlx, dlxType, { durable: true });
      await channel.assertQueue(dlq, { durable: true });
      await channel.bindQueue(dlq, dlx, dlqRoutingKey);

      await channel.assertQueue(queue, {
        durable: true,
        arguments: { "x-dead-letter-exchange": dlx },
      });
      console.log(
        `Dead-letter queue set up: ${dlq} bound to exchange: ${dlx}, type: ${dlxType}, routingKey: ${dlqRoutingKey}`
      );
    } catch (err) {
      console.error(`Failed to set up dead-letter queue for ${queue}:`, err);
      this.emit("error", err);
    }
  }

  /**
   * Consumes messages from a specified queue.
   * The consumer is responsible for acknowledging messages (ack/nack).
   * @param queue - The queue name.
   * @param onMessage - Callback to handle incoming messages.
   */
  public async consume(
    queue: string,
    onMessage: (msg: Message, channel: Channel) => Promise<void>
  ): Promise<void> {
    try {
      const channel = await this.ensureChannel();
      await channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            await onMessage(msg, channel); // Delegate ack/nack to the consumer
          } catch (err) {
            console.error("Message handling failed:", err);
            this.emit("error", err);
          }
        }
      });
      console.log(`Consumer set up for queue: ${queue}`);
    } catch (err) {
      console.error("Failed to set up consumer:", err);
      this.emit("error", err);
    }
  }

  /**
   * Closes the RabbitMQ connection and channel.
   */
  public async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log("RabbitMQ connection closed.");
    } catch (err) {
      console.error("Error while closing RabbitMQ connection:", err);
      this.emit("error", err);
    }
  }
}

export default RabbitMQBroker;
