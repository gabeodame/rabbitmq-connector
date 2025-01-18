import amqp, { Connection, Channel, Message, Options } from "amqplib";
import EventEmitter from "events";

interface QueueConfig {
  exchange: string;
  mainQueue: string;
  dlx: string;
  dlq: string;
  routingKey: string;
}

/**
 * RabbitMQBroker:A singleton class for managing RabbitMQ connections, channels,
 * and operations such as publishing, consuming, and setting up queues/exchanges.
 */
export class RabbitMQBroker {
  private static instance: RabbitMQBroker;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Gets the singleton instance of RabbitMQBroker.
   * @returns The singleton instance of RabbitMQBroker.
   */
  public static getInstance(): RabbitMQBroker {
    if (!RabbitMQBroker.instance) {
      RabbitMQBroker.instance = new RabbitMQBroker();
    }
    return RabbitMQBroker.instance;
  }

  /**
   * Initializes the RabbitMQ connection and channel.
   * @param url - The RabbitMQ connection URL.
   */
  public async init(url: string): Promise<void> {
    if (!url) {
      throw new Error("RabbitMQ connection URL is undefined.");
    }

    try {
      this.connection = await amqp.connect(url.trim());
      this.channel = await this.connection.createChannel();
      console.log("RabbitMQ connection and channel established.");
      this.eventEmitter.emit("connected");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      throw error;
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
      this.eventEmitter.emit("disconnected");
    } catch (error) {
      console.error("Error while closing RabbitMQ connection:", error);
    }
  }

  /**
   * Publishes a message directly to a specified queue.
   * @param queue - The queue name.
   * @param message - The message to publish.
   * @param options - Additional publish options.
   */
  public async publishToQueue(
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
      this.eventEmitter.emit("messagePublished", { queue, message });
    } catch (error) {
      console.error("Failed to publish message to queue:", error);
      throw error;
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
    options: Options.Publish = {}
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    try {
      await this.channel.assertExchange(exchange, "topic", { durable: true });
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.isBuffer(message) ? message : Buffer.from(message),
        options
      );
      console.log(
        `Message published to exchange: ${exchange}, routingKey: ${routingKey}`
      );
      this.eventEmitter.emit("messagePublished", {
        exchange,
        routingKey,
        message,
      });
    } catch (error) {
      console.error("Failed to publish message to exchange:", error);
      throw error;
    }
  }

  /**
   * Asserts an exchange.
   * @param exchange - The exchange name.
   * @param type - The type of the exchange.
   * @param options - Additional exchange options.
   */
  public async assertExchange(
    exchange: string,
    type: "direct" | "topic" | "fanout" | "headers",
    options: Options.AssertExchange = { durable: true }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }
    await this.channel.assertExchange(exchange, type, options);
    console.log(`Exchange asserted: ${exchange}`);
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
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }
    await this.channel.assertQueue(queue, options);
    console.log(`Queue set up: ${queue}`);
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
    await this.channel.bindQueue(queue, exchange, routingKey);
    console.log(
      `Queue "${queue}" bound to exchange "${exchange}" with routing key "${routingKey}"`
    );
  }

  /**
   * Consumes messages from a specified queue.
   * @param queue - The queue name.
   * @param onMessage - Callback to handle incoming messages.
   */
  public async consume(
    queue: string,
    onMessage: (msg: Message, channel: Channel) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          await onMessage(msg, this.channel!);
          this.eventEmitter.emit("messageConsumed", { queue, msg });
        } catch (error) {
          console.error("Error processing message:", error);
        }
      }
    });
    console.log(`Consumer set up for queue: ${queue}`);
  }

  /**
   * Sets up a dead-letter queue and binds it to the main queue.
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
    if (!this.channel) {
      throw new Error(
        "RabbitMQ channel is not initialized. Call init() first."
      );
    }

    await this.channel.assertExchange(dlx, dlxType, { durable: true });
    await this.channel.assertQueue(dlq, { durable: true });
    await this.channel.bindQueue(dlq, dlx, dlqRoutingKey);
    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": dlx,
      },
    });

    console.log(
      `Dead-letter queue (${dlq}) set up and bound to exchange (${dlx})`
    );
  }

  /**
   * Creates a high-level `MessageQueueManager` instance.
   * @param config - Configuration for the queue.
   * @returns A `MessageQueueManager` instance.
   */
  public createMessageQueueManager(config: QueueConfig): MessageQueueManager {
    return new MessageQueueManager(config, this);
  }

  /**
   * Gets the EventEmitter instance.
   * @returns The EventEmitter instance for subscribing to RabbitMQ events.
   */
  public getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
}

// Supporting High-Level MessageQueueManager
/**
 * MessageQueueManager: High-level class for managing message queues.
 * Provides methods for initializing queues and processing messages.
 */
class MessageQueueManager {
  private broker: RabbitMQBroker;
  private config: QueueConfig;

  constructor(config: QueueConfig, broker: RabbitMQBroker) {
    this.broker = broker;
    this.config = config;
  }

  public async initialize(): Promise<void> {
    const { exchange, mainQueue, dlx, dlq, routingKey } = this.config;

    await this.broker.setupDeadLetterQueue(mainQueue, dlx, dlq);
    await this.broker.assertExchange(exchange, "topic", { durable: true });
    await this.broker.setupQueue(mainQueue, {
      durable: true,
      arguments: { "x-dead-letter-exchange": dlx },
    });
    await this.broker.bindQueue(mainQueue, exchange, routingKey);
  }

  public async processDLQ(handler: (msg: any) => Promise<void>): Promise<void> {
    const { dlq } = this.config;
    await this.broker.consume(dlq, handler);
  }

  public async processMainQueue(
    handler: (msg: any) => Promise<void>
  ): Promise<void> {
    const { mainQueue } = this.config;
    await this.broker.consume(mainQueue, handler);
  }
}
