import { Message, Options } from "amqplib";
declare class RabbitMQBroker {
    private static instance;
    private connection;
    private channel;
    private constructor();
    /**
     * Gets the singleton instance of the RabbitMQBroker.
     */
    static getInstance(): RabbitMQBroker;
    /**
     * Initializes the connection and channel to RabbitMQ.
     * @param url - The RabbitMQ connection URL.
     */
    init(url: string): Promise<void>;
    /**
     * Publishes a message directly to a specified queue.
     * @param queue - The queue name.
     * @param message - The message to publish.
     * @param options - Additional publish options.
     */
    publish(queue: string, message: Buffer | string, options?: Options.Publish): Promise<void>;
    assertExchange(exchange: string, type: "direct" | "topic" | "fanout" | "headers", options?: Options.AssertExchange): Promise<void>;
    /**
     * Publishes a message to a specified exchange with a routing key.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     * @param message - The message to publish.
     * @param options - Additional publish options.
     */
    publishToExchange(exchange: string, routingKey: string, message: Buffer | string, type?: "direct" | "topic" | "fanout" | "headers", // Default to "topic"
    options?: Options.Publish): Promise<void>;
    /**
     * Sets up a queue with an optional dead-letter exchange.
     * @param queue - The queue name.
     * @param options - Queue options (including dead-letter configurations).
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
     * Consumes messages from a specified queue.
     * @param queue - The queue name.
     * @param onMessage - Callback to handle incoming messages.
     */
    consume(queue: string, onMessage: (msg: Message) => Promise<void>): Promise<void>;
    /**
     * Sets up a dead-letter queue and binds it to the main queue.
     * @param queue - The primary queue name.
     * @param dlx - The dead-letter exchange name.
     * @param dlq - The dead-letter queue name.
     */
    setupDeadLetterQueue(queue: string, dlx: string, dlq: string, dlxType?: "direct" | "topic" | "fanout" | "headers"): Promise<void>;
    /**
     * Closes the RabbitMQ connection and channel.
     */
    closeConnection(): Promise<void>;
}
export default RabbitMQBroker;
