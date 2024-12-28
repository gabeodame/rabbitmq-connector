import amqp, { Connection, Channel, Message, Options } from "amqplib";

class RabbitMQBroker {
  private static instance: RabbitMQBroker;
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private constructor() {}

  /**
   * Gets the singleton instance of the RabbitMQBroker.
   */
  public static getInstance(): RabbitMQBroker {
    if (!RabbitMQBroker.instance) {
      RabbitMQBroker.instance = new RabbitMQBroker();
    }
    return RabbitMQBroker.instance;
  }

  /**
   * Initializes the connection and channel to RabbitMQ.
   * @param url - The RabbitMQ connection URL.
   */
  public async init(url: string): Promise<void> {
    if (!url) {
      throw new Error("RabbitMQ connection URL is undefined.");
    }

    const sanitizedUrl = url.trim();
    console.log("Connecting to RabbitMQ with sanitized URL:", sanitizedUrl);

    try {
      this.connection = await amqp.connect(sanitizedUrl);
      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ connection and channel established.");
    } catch (err) {
      console.error("Failed to connect to RabbitMQ:", {
        url: sanitizedUrl,
        error: (err as Error).message,
        stack: (err as Error).stack,
      });
      throw err;
    }
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
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(
        queue,
        Buffer.isBuffer(message) ? message : Buffer.from(message),
        options
      );
      console.log(`Message published to queue: ${queue}`);
    } catch (err) {
      console.error("Failed to publish message to queue:", err);
      throw err;
    }
  }

  /**
   * Publishes a message to a specified exchange with a routing key.
   * @param exchange - The exchange name.
   * @param routingKey - The routing key.
   * @param message - The message to publish.
   * @param options - Additional publish options.
   */
  public async publishToExchange(
    exchange: string,
    routingKey: string,
    message: Buffer | string,
    type: "direct" | "topic" | "fanout" | "headers" = "topic", // Default to "topic"
    options: Options.Publish = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.assertExchange(exchange, type, { durable: true });
      this.channel.publish(
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
      throw err;
    }
  }

  /**
   * Sets up a queue with an optional dead-letter exchange.
   * @param queue - The queue name.
   * @param options - Queue options (including dead-letter configurations).
   */
  public async setupQueue(
    queue: string,
    options: Options.AssertQueue = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.assertQueue(queue, options);
      console.log(`Queue set up: ${queue}`);
    } catch (err) {
      console.error(`Failed to set up queue: ${queue}`, err);
      throw err;
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
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.bindQueue(queue, exchange, routingKey);
      console.log(
        `Queue "${queue}" bound to exchange "${exchange}" with routing key "${routingKey}"`
      );
    } catch (err) {
      console.error("Failed to bind queue:", err);
      throw err;
    }
  }

  /**
   * Consumes messages from a specified queue.
   * @param queue - The queue name.
   * @param onMessage - Callback to handle incoming messages.
   */
  public async consume(
    queue: string,
    onMessage: (msg: Message) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            await onMessage(msg);
            this.channel!.ack(msg);
          } catch (err) {
            console.error("Message handling failed, requeueing message:", err);
            this.channel!.nack(msg, false, true); // Requeue message
          }
        }
      });

      console.log(`Consumer set up for queue: ${queue}`);
    } catch (err) {
      console.error("Failed to set up consumer:", err);
      throw err;
    }
  }

  /**
   * Sets up a dead-letter queue and binds it to the main queue.
   * @param queue - The primary queue name.
   * @param dlx - The dead-letter exchange name.
   * @param dlq - The dead-letter queue name.
   */
  public async setupDeadLetterQueue(
    queue: string,
    dlx: string,
    dlq: string,
    dlxType: "direct" | "topic" | "fanout" | "headers" = "topic" // Default to "topic"
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      // Assert the dead-letter exchange and queue
      await this.channel.assertExchange(dlx, dlxType, { durable: true });
      await this.channel.assertQueue(dlq, { durable: true });
      await this.channel.bindQueue(dlq, dlx, "#"); // Bind all messages to DLQ

      // Assert the primary queue with dead-letter exchange configuration
      await this.channel.assertQueue(queue, {
        durable: true,
        deadLetterExchange: dlx,
      });

      console.log(
        `Dead-letter queue set up: ${dlq} bound to exchange: ${dlx}, type: ${dlxType}`
      );
    } catch (err) {
      console.error(`Failed to set up dead-letter queue for ${queue}:`, err);
      throw err;
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
    }
  }
}

export default RabbitMQBroker;
