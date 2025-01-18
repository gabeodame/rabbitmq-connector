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
const events_1 = __importDefault(require("events"));
/**
 * RabbitMQBroker
 * A singleton class to manage RabbitMQ connections, channels, and messaging.
 * Includes support for dead-letter queues, error handling, and EventEmitter for external integrations.
 */
class RabbitMQBroker extends events_1.default {
    constructor() {
        super(); // Initialize EventEmitter
        this.connection = null;
        this.channel = null;
    }
    /**
     * Gets the singleton instance of the RabbitMQBroker.
     * @returns RabbitMQBroker instance.
     */
    static getInstance() {
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
    init(url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!url) {
                this.emit("error", new Error("RabbitMQ connection URL is undefined."));
                return;
            }
            const sanitizedUrl = url.trim();
            console.log("Connecting to RabbitMQ with sanitized URL:", sanitizedUrl);
            try {
                this.connection = yield amqplib_1.default.connect(sanitizedUrl);
                this.connection.on("close", () => {
                    console.error("RabbitMQ connection closed.");
                    this.emit("connectionClosed");
                    this.connection = null;
                    this.channel = null;
                });
                this.channel = yield this.connection.createChannel();
                console.log("RabbitMQ connection and channel established.");
            }
            catch (err) {
                console.error("Failed to connect to RabbitMQ:", err);
                this.emit("error", err);
                throw err; // Optionally rethrow to handle at the caller level
            }
        });
    }
    /**
     * Ensures that the channel is available.
     * Re-establishes the channel if it is closed.
     * @returns The RabbitMQ channel.
     * @throws Error if the channel cannot be initialized.
     */
    ensureChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.channel && this.connection) {
                console.warn("Re-establishing RabbitMQ channel...");
                this.channel = yield this.connection.createChannel();
                console.log("RabbitMQ channel re-established.");
            }
            if (!this.channel) {
                const error = new Error("RabbitMQ channel is not initialized.");
                this.emit("error", error);
                throw error;
            }
            return this.channel;
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
            try {
                const channel = yield this.ensureChannel();
                yield channel.assertQueue(queue, { durable: true });
                channel.sendToQueue(queue, Buffer.isBuffer(message) ? message : Buffer.from(message), options);
                console.log(`Message published to queue: ${queue}`);
            }
            catch (err) {
                console.error("Failed to publish message to queue:", err);
                this.emit("error", err);
            }
        });
    }
    /**
     * Publishes a message to a specified exchange with a routing key.
     * @param exchange - The exchange name.
     * @param routingKey - The routing key.
     * @param message - The message to publish.
     * @param type - The type of the exchange (default: "topic").
     * @param options - Additional publish options.
     */
    publishToExchange(exchange_1, routingKey_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (exchange, routingKey, message, type = "topic", options = {}) {
            try {
                const channel = yield this.ensureChannel();
                yield channel.assertExchange(exchange, type, { durable: true });
                channel.publish(exchange, routingKey, Buffer.isBuffer(message) ? message : Buffer.from(message), options);
                console.log(`Message published to exchange: ${exchange}, routingKey: ${routingKey}, type: ${type}`);
            }
            catch (err) {
                console.error("Failed to publish message to exchange:", err);
                this.emit("error", err);
            }
        });
    }
    /**
     * Asserts an exchange.
     * Ensures that the specified exchange exists, creating it if necessary.
     * @param exchange - The name of the exchange.
     * @param type - The type of the exchange (e.g., "direct", "topic").
     * @param options - Options to configure the exchange.
     * @throws Error if the channel is not initialized or if assertion fails.
     */
    assertExchange(exchange_1, type_1) {
        return __awaiter(this, arguments, void 0, function* (exchange, type, options = { durable: true }) {
            try {
                const channel = yield this.ensureChannel();
                yield channel.assertExchange(exchange, type, options);
                console.log(`Exchange asserted: ${exchange}`);
            }
            catch (err) {
                console.error(`Failed to assert exchange: ${exchange}`, err);
                this.emit("error", err);
            }
        });
    }
    /**
     * Sets up a queue with optional arguments.
     * @param queue - The queue name.
     * @param options - Queue options.
     */
    setupQueue(queue_1) {
        return __awaiter(this, arguments, void 0, function* (queue, options = {}) {
            try {
                const channel = yield this.ensureChannel();
                yield channel.assertQueue(queue, options);
                console.log(`Queue set up: ${queue}`);
            }
            catch (err) {
                console.error(`Failed to set up queue: ${queue}`, err);
                this.emit("error", err);
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
            try {
                const channel = yield this.ensureChannel();
                yield channel.bindQueue(queue, exchange, routingKey);
                console.log(`Queue "${queue}" bound to exchange "${exchange}" with routing key "${routingKey}"`);
            }
            catch (err) {
                console.error("Failed to bind queue:", err);
                this.emit("error", err);
            }
        });
    }
    /**
     * Sets up a dead-letter queue (DLQ) and binds it to the main queue.
     * @param queue - The primary queue name.
     * @param dlx - The dead-letter exchange name.
     * @param dlq - The dead-letter queue name.
     * @param dlxType - The type of the dead-letter exchange (default: "topic").
     * @param dlqRoutingKey - The routing key for dead-lettered messages (default: "#").
     */
    setupDeadLetterQueue(queue_1, dlx_1, dlq_1) {
        return __awaiter(this, arguments, void 0, function* (queue, dlx, dlq, dlxType = "topic", dlqRoutingKey = "#") {
            try {
                const channel = yield this.ensureChannel();
                yield channel.assertExchange(dlx, dlxType, { durable: true });
                yield channel.assertQueue(dlq, { durable: true });
                yield channel.bindQueue(dlq, dlx, dlqRoutingKey);
                yield channel.assertQueue(queue, {
                    durable: true,
                    arguments: { "x-dead-letter-exchange": dlx },
                });
                console.log(`Dead-letter queue set up: ${dlq} bound to exchange: ${dlx}, type: ${dlxType}, routingKey: ${dlqRoutingKey}`);
            }
            catch (err) {
                console.error(`Failed to set up dead-letter queue for ${queue}:`, err);
                this.emit("error", err);
            }
        });
    }
    /**
     * Consumes messages from a specified queue.
     * The consumer is responsible for acknowledging messages (ack/nack).
     * @param queue - The queue name.
     * @param onMessage - Callback to handle incoming messages.
     */
    consume(queue, onMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channel = yield this.ensureChannel();
                yield channel.consume(queue, (msg) => __awaiter(this, void 0, void 0, function* () {
                    if (msg !== null) {
                        try {
                            yield onMessage(msg, channel); // Delegate ack/nack to the consumer
                        }
                        catch (err) {
                            console.error("Message handling failed:", err);
                            this.emit("error", err);
                        }
                    }
                }));
                console.log(`Consumer set up for queue: ${queue}`);
            }
            catch (err) {
                console.error("Failed to set up consumer:", err);
                this.emit("error", err);
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
                this.emit("error", err);
            }
        });
    }
}
exports.default = RabbitMQBroker;
