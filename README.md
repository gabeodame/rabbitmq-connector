
# @anchordiv/rabbitmq-broker

A simple and flexible RabbitMQ singleton wrapper for Node.js applications. This package provides an easy-to-use interface for connecting to RabbitMQ, publishing messages to queues or exchanges, and consuming messages. It supports durable queues, dead-letter queues, and exchange-based routing with various exchange types.

This package is **framework-agnostic** and can be seamlessly integrated with any Node.js framework, including **Express**, **NestJS**, or other custom Node.js setups.

---

## Features

- Singleton pattern to ensure a single RabbitMQ connection per application.
- Publish messages directly to queues or exchanges with routing keys.
- Consume messages with built-in acknowledgment handling.
- Support for durable queues and dead-letter exchanges.
- Works with any Node.js framework, including Express, NestJS, and more.
- Designed to integrate seamlessly with microservices architectures.

---

## Installation

```bash
npm install @anchordiv/rabbitmq-broker
```

---

## Setup

1. Ensure RabbitMQ is running and accessible.
2. Set the RabbitMQ connection URL in your environment variables:

   ```bash
   # You can set the RabbitMQ connection URL as an environment variable:

    export RABBITMQ_URL=amqp://username:password@host:port

    # Alternatively, you can add it to your .env file for better maintainability

    RABBITMQ_URL=amqp://username:password@host:port
   ```

---

## Usage

### 1. Initialize the Broker

Before using the broker, initialize it with the RabbitMQ connection URL.

```typescript
import RabbitMQBroker from "@anchordiv/rabbitmq-broker";

const broker = RabbitMQBroker.getInstance();
await broker.init(process.env.RABBITMQ_URL!);
```

---

### 2. Publish Messages

#### Publish Directly to a Queue

```typescript
await broker.publish("my_queue", JSON.stringify({ example: "data" }));
```

#### Publish to an Exchange

```typescript
await broker.publishToExchange(
  "my_exchange",
  "my.routing.key",
  JSON.stringify({ example: "data" }),
  "topic" // Exchange type: "direct", "topic", "fanout", or "headers"
);
```

---

### 3. Consume Messages

#### Consume Messages Published to an Exchange

To consume messages published to an exchange, you must set up a queue, bind it to the exchange, and then consume the messages.

```typescript
import RabbitMQBroker from "@anchordiv/rabbitmq-broker";

(async () => {
  const broker = RabbitMQBroker.getInstance();
  await broker.init(process.env.RABBITMQ_URL!);

  const exchange = "recipe.users.profile-updates";
  const queue = "user-signup-queue";
  const routingKey = "users.signup.new-user";

  // Step 1: Set up the queue
  await broker.setupQueue(queue, { durable: true });

  // Step 2: Bind the queue to the exchange with the routing key
  await broker.bindQueue(queue, exchange, routingKey);

  // Step 3: Consume messages from the queue
  await broker.consume(queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log("Message received:", data);

    // Process the message
  });

  console.log(`Consumer set up for queue: ${queue}, exchange: ${exchange}, routingKey: ${routingKey}`);
})();
```

#### Direct Queue Consumption Example

For direct consumption from a queue without an exchange:

```typescript
import RabbitMQBroker from "@anchordiv/rabbitmq-broker";

(async () => {
  const broker = RabbitMQBroker.getInstance();
  await broker.init(process.env.RABBITMQ_URL!);

  const queue = "direct-queue-example";

  // Step 1: Set up the queue
  await broker.setupQueue(queue, { durable: true });

  // Step 2: Consume messages from the queue
  await broker.consume(queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    console.log("Message received:", data);

    // Process the message
  });

  console.log(`Consumer set up for direct queue: ${queue}`);
})();
```

---

### 4. Set Up a Queue with Dead-Letter Support

Use `setupQueue` to create a durable queue and optionally configure a dead-letter exchange.

```typescript
await broker.setupQueue("primary_queue", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "my_dead_letter_exchange",
  },
});
```

Set up the dead-letter exchange and queue:

```typescript
await broker.setupDeadLetterQueue(
  "primary_queue",
  "my_dead_letter_exchange",
  "my_dead_letter_queue",
  "topic"
);
```

---

## API Reference

### `RabbitMQBroker.getInstance()`

Returns the singleton instance of the `RabbitMQBroker`.

### `init(url: string): Promise<void>`

Initializes the RabbitMQ connection and channel.

### `publish(queue: string, message: Buffer | string, options?: Options.Publish): Promise<void>`

Publishes a message directly to a queue.

### `publishToExchange(exchange: string, routingKey: string, message: Buffer | string, type?: string, options?: Options.Publish): Promise<void>`

Publishes a message to a specified exchange with a routing key.

### `setupQueue(queue: string, options?: Options.AssertQueue): Promise<void>`

Creates a queue with optional configurations.

### `consume(queue: string, onMessage: (msg: Message) => Promise<void>): Promise<void>`

Consumes messages from a specified queue.

### `bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>`

Binds a queue to a specified exchange with a routing key.

### `setupDeadLetterQueue(queue: string, dlx: string, dlq: string, dlxType?: string): Promise<void>`

Sets up a dead-letter queue and binds it to the main queue.

### `closeConnection(): Promise<void>`

Closes the RabbitMQ connection and channel.

---

## Contributing

We welcome contributions! Please follow the guidelines below:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact

For questions or support, please open an issue on the [GitHub repository](https://github.com/gabeodame/rabbitmq-broker) or email `support@anchordiv.com`.

