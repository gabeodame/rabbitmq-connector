import { Channel, Message, Options } from "amqplib";
import EventEmitter from "events";
/**
 * RabbitMQBroker
 * A singleton class to manage RabbitMQ connections, channels, and messaging.
 * Includes support for dead-letter queues, error handling, and EventEmitter for external integrations.
 */
declare class RabbitMQBroker extends EventEmitter {
    private static instance;
    private connection;
    private channel;
    private constructor();
    /**
     * Gets the singleton instance of the RabbitMQBroker.
     * @returns RabbitMQBroker instance.
     */
    static getInstance(): RabbitMQBroker;
    /**
     * Initializes the RabbitMQ connection and channel.
     * Emits an "error" event if the connection or channel fails.
     * @param url - The RabbitMQ connection URL.
     * @throws Error if the connection URL is invalid or connection fails.
     */
    init(url: string): Promise<void>;
    /**
     * Ensures that the channel is available.
     * Re-establishes the channel if it is closed.
     * @returns The RabbitMQ channel.
     * @throws Error if the channel cannot be initialized.
     */
    private ensureChannel;
    /**
     * Publishes a message directly to a specified queue.
     * @param queue - The queue name.
     * @param message - The message to publish.
     * @param options - Additional publish options.
     */
    publish(queue: string, message: Buffer | string, options?: Options.Publish): Promise<void>;
    /**
     * Publishes a message to a specified exchange with a routing key.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     * @param message - The message to publish.
     * @param type - The type of the exchange (default: "topic").
     * @param options - Additional publish options.
     */
    publishToExchange(exchange: string, routingKey: string, message: Buffer | string, type?: "direct" | "topic" | "fanout" | "headers", options?: Options.Publish): Promise<void>;
    /**
     * Asserts an exchange.
     * Ensures that the specified exchange exists, creating it if necessary.
     * @param exchange - The name of the exchange.
     * @param type - The type of the exchange (e.g., "direct", "topic").
     * @param options - Options to configure the exchange.
     * @throws Error if the channel is not initialized or if assertion fails.
     */
    assertExchange(exchange: string, type: "direct" | "topic" | "fanout" | "headers", options?: Options.AssertExchange): Promise<void>;
    /**
     * Sets up a queue with optional arguments.
     * @param queue - The queue name.
     * @param options - Queue options.
     */
    setupQueue(queue: string, options?: Options.AssertQueue): Promise<void>;
    /**
     * Binds a queue to an exchange with a routing key.
     * @param queue - The queue name.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     */
    bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
    /**
     * Sets up a dead-letter queue (DLQ) and binds it to the main queue.
     * @param queue - The primary queue name.
     * @param dlx - The dead-letter exchange name.
     * @param dlq - The dead-letter queue name.
     * @param dlxType - The type of the dead-letter exchange (default: "topic").
     * @param dlqRoutingKey - The routing key for dead-lettered messages (default: "#").
     */
    setupDeadLetterQueue(queue: string, dlx: string, dlq: string, dlxType?: "direct" | "topic" | "fanout" | "headers", dlqRoutingKey?: string): Promise<void>;
    /**
     * Consumes messages from a specified queue.
     * The consumer is responsible for acknowledging messages (ack/nack).
     * @param queue - The queue name.
     * @param onMessage - Callback to handle incoming messages.
     */
    consume(queue: string, onMessage: (msg: Message, channel: Channel) => Promise<void>): Promise<void>;
    /**
     * Closes the RabbitMQ connection and channel.
     */
    closeConnection(): Promise<void>;
}
export default RabbitMQBroker;
