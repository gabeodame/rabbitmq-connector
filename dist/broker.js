"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
class RabbitMQBroker {
    constructor() {
        this.connection = null;
        this.channel = null;
    }
    /**
     * Gets the singleton instance of the RabbitMQBroker.
     */
    static getInstance() {
        if (!RabbitMQBroker.instance) {
            RabbitMQBroker.instance = new RabbitMQBroker();
        }
        return RabbitMQBroker.instance;
    }
    /**
     * Initializes the connection and channel to RabbitMQ.
     * @param url - The RabbitMQ connection URL.
     */
    init(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url) {
                throw new Error("RabbitMQ connection URL is undefined.");
            }
            const sanitizedUrl = url.trim();
            console.log("Connecting to RabbitMQ with sanitized URL:", sanitizedUrl);
            try {
                this.connection = yield amqplib_1.default.connect(sanitizedUrl);
                this.channel = yield this.connection.createChannel();
                console.log("RabbitMQ connection and channel established.");
            }
            catch (err) {
                console.error("Failed to connect to RabbitMQ:", {
                    url: sanitizedUrl,
                    error: err.message,
                    stack: err.stack,
                });
                throw err;
            }
        });
    }
    /**
     * Publishes a message directly to a specified queue.
     * @param queue - The queue name.
     * @param message - The message to publish.
     * @param options - Additional publish options.
     */
    publish(queue_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (queue, message, options = {}) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.channel.assertQueue(queue, { durable: true });
                this.channel.sendToQueue(queue, Buffer.isBuffer(message) ? message : Buffer.from(message), options);
                console.log(`Message published to queue: ${queue}`);
            }
            catch (err) {
                console.error("Failed to publish message to queue:", err);
                throw err;
            }
        });
    }
    assertExchange(exchange_1, type_1) {
        return __awaiter(this, arguments, void 0, function* (exchange, type, options = { durable: true }) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.channel.assertExchange(exchange, type, options);
                console.log(`Exchange asserted: ${exchange}`);
            }
            catch (err) {
                console.error(`Failed to assert exchange: ${exchange}`, err);
                throw err;
            }
        });
    }
    /**
     * Publishes a message to a specified exchange with a routing key.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     * @param message - The message to publish.
     * @param options - Additional publish options.
     */
    publishToExchange(exchange_1, routingKey_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (exchange, routingKey, message, type = "topic", // Default to "topic"
        options = {}) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.assertExchange(exchange, type, { durable: true });
                this.channel.publish(exchange, routingKey, Buffer.isBuffer(message) ? message : Buffer.from(message), options);
                console.log(`Message published to exchange: ${exchange}, routingKey: ${routingKey}, type: ${type}`);
            }
            catch (err) {
                console.error("Failed to publish message to exchange:", err);
                throw err;
            }
        });
    }
    /**
     * Sets up a queue with an optional dead-letter exchange.
     * @param queue - The queue name.
     * @param options - Queue options (including dead-letter configurations).
     */
    setupQueue(queue_1) {
        return __awaiter(this, arguments, void 0, function* (queue, options = {}) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.channel.assertQueue(queue, options);
                console.log(`Queue set up: ${queue}`);
            }
            catch (err) {
                console.error(`Failed to set up queue: ${queue}`, err);
                throw err;
            }
        });
    }
    /**
     * Binds a queue to an exchange with a routing key.
     * @param queue - The queue name.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     */
    bindQueue(queue, exchange, routingKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.channel.bindQueue(queue, exchange, routingKey);
                console.log(`Queue "${queue}" bound to exchange "${exchange}" with routing key "${routingKey}"`);
            }
            catch (err) {
                console.error("Failed to bind queue:", err);
                throw err;
            }
        });
    }
    /**
     * Consumes messages from a specified queue.
     * @param queue - The queue name.
     * @param onMessage - Callback to handle incoming messages.
     */
    consume(queue, onMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                yield this.channel.consume(queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                    if (msg !== null) {
                        try {
                            yield onMessage(msg);
                            this.channel.ack(msg);
                        }
                        catch (err) {
                            console.error("Message handling failed, requeueing message:", err);
                            this.channel.nack(msg, false, true); // Requeue message
                        }
                    }
                }));
                console.log(`Consumer set up for queue: ${queue}`);
            }
            catch (err) {
                console.error("Failed to set up consumer:", err);
                throw err;
            }
        });
    }
    /**
     * Sets up a dead-letter queue and binds it to the main queue.
     * @param queue - The primary queue name.
     * @param dlx - The dead-letter exchange name.
     * @param dlq - The dead-letter queue name.
     */
    setupDeadLetterQueue(queue_1, dlx_1, dlq_1) {
        return __awaiter(this, arguments, void 0, function* (queue, dlx, dlq, dlxType = "topic" // Default to "topic"
        ) {
            if (!this.channel) {
                throw new Error("RabbitMQ channel is not initialized. Call init() first.");
            }
            try {
                // Assert the dead-letter exchange and queue
                yield this.channel.assertExchange(dlx, dlxType, { durable: true });
                yield this.channel.assertQueue(dlq, { durable: true });
                yield this.channel.bindQueue(dlq, dlx, "#"); // Bind all messages to DLQ
                // Assert the primary queue with dead-letter exchange configuration
                yield this.channel.assertQueue(queue, {
                    durable: true,
                    deadLetterExchange: dlx,
                });
                console.log(`Dead-letter queue set up: ${dlq} bound to exchange: ${dlx}, type: ${dlxType}`);
            }
            catch (err) {
                console.error(`Failed to set up dead-letter queue for ${queue}:`, err);
                throw err;
            }
        });
    }
    /**
     * Closes the RabbitMQ connection and channel.
     */
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.channel) {
                    yield this.channel.close();
                    this.channel = null;
                }
                if (this.connection) {
                    yield this.connection.close();
                    this.connection = null;
                }
                console.log("RabbitMQ connection closed.");
            }
            catch (err) {
                console.error("Error while closing RabbitMQ connection:", err);
            }
        });
    }
}
exports.default = RabbitMQBroker;
