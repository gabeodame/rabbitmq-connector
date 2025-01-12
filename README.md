
# @anchordiv/rabbitmq-broker

A robust and flexible RabbitMQ singleton wrapper for Node.js applications. This package simplifies RabbitMQ integration by providing an easy-to-use API for connecting, publishing, and consuming messages. It supports durable queues, dead-letter queues (DLQs), and exchange-based routing with multiple exchange types.

This package is **framework-agnostic** and integrates seamlessly with any Node.js framework, including **Express**, **NestJS**, or custom setups.

---

## Features

- **Singleton Pattern**: Ensures a single RabbitMQ connection per application.
- **Publish/Consume**: Simplified methods for publishing to queues or exchanges and consuming messages.
- **Dead-Letter Support**: Automatic setup of DLQs with flexible binding.
- **Exchange Types**: Supports `"direct"`, `"topic"`, `"fanout"`, and `"headers"`.
- **Customizable**: Fully configurable routing keys, queue options, and more.
- **Framework Agnostic**: Works with any Node.js framework.

---

## Installation

```bash
npm install @anchordiv/rabbitmq-broker
```

---

## Setup

1. **Install RabbitMQ**: Ensure RabbitMQ is running and accessible.
2. **Set Connection URL**: Add your RabbitMQ connection URL to your environment variables:

   ```bash
   export RABBITMQ_URL=amqp://username:password@host:port
   ```

   Alternatively, use a `.env` file for configuration:

   ```plaintext
   RABBITMQ_URL=amqp://username:password@host:port
   ```

---

## Usage

### 1. Initialize the Broker

```typescript
import RabbitMQBroker from "@anchordiv/rabbitmq-broker";

const broker = RabbitMQBroker.getInstance();
await broker.init(process.env.RABBITMQ_URL!);
```

---

### 2. Publish Messages

#### Publish to a Queue

```typescript
await broker.publish("my_queue", JSON.stringify({ example: "data" }));
```

#### Publish to an Exchange

```typescript
await broker.publishToExchange(
  "my_exchange",
  "my.routing.key",
  JSON.stringify({ example: "data" }),
  "topic"
);
```

---

### 3. Consume Messages

#### Consume from a Queue

```typescript
await broker.consume("my_queue", async (msg) => {
  const data = JSON.parse(msg.content.toString());
  console.log("Message received:", data);
});
```

#### Consume with Dead-Letter Support

Set up a queue and its associated DLQ:

```typescript
await broker.setupDeadLetterQueue(
  "primary_queue",
  "my_dead_letter_exchange",
  "my_dead_letter_queue",
  "topic",
  "optional.routing.key" // Optional custom routing key for DLQ binding
);

await broker.consume("primary_queue", async (msg) => {
  const data = JSON.parse(msg.content.toString());
  console.log("Message received:", data);
});

await broker.consume("my_dead_letter_queue", async (msg) => {
  const data = JSON.parse(msg.content.toString());
  console.error("Dead-lettered message:", data);
});
```

---

### 4. Set Up a Queue with Dead-Letter Support

```typescript
await broker.setupQueue("primary_queue", {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": "my_dead_letter_exchange",
  },
});
```

Bind the queue to an exchange with a routing key:

```typescript
await broker.bindQueue("primary_queue", "my_exchange", "my.routing.key");
```

---

## API Reference

### Core Methods

- **`RabbitMQBroker.getInstance(): RabbitMQBroker`**  
  Returns the singleton instance of the `RabbitMQBroker`.

- **`init(url: string): Promise<void>`**  
  Initializes the RabbitMQ connection and channel.  
  - `url` *(string)*: RabbitMQ connection URL.

---

### Publishing Methods

- **`publish(queue: string, message: Buffer | string, options?: Options.Publish): Promise<void>`**  
  Publishes a message to a queue.  
  - `queue` *(string)*: Queue name.
  - `message` *(Buffer | string)*: Message content.
  - `options` *(Options.Publish, optional)*: Publish options.

- **`publishToExchange(exchange: string, routingKey: string, message: Buffer | string, type?: string, options?: Options.Publish): Promise<void>`**  
  Publishes a message to an exchange.  
  - `exchange` *(string)*: Exchange name.
  - `routingKey` *(string)*: Routing key.
  - `message` *(Buffer | string)*: Message content.
  - `type` *(string, optional)*: Exchange type. Default is `"topic"`.
  - `options` *(Options.Publish, optional)*: Publish options.

---

### Queue and Consumer Methods

- **`setupQueue(queue: string, options?: Options.AssertQueue): Promise<void>`**  
  Sets up a queue.  
  - `queue` *(string)*: Queue name.
  - `options` *(Options.AssertQueue, optional)*: Queue options.

- **`bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>`**  
  Binds a queue to an exchange.  
  - `queue` *(string)*: Queue name.
  - `exchange` *(string)*: Exchange name.
  - `routingKey` *(string)*: Routing key.

- **`consume(queue: string, onMessage: (msg: Message) => Promise<void>): Promise<void>`**  
  Consumes messages from a queue.  
  - `queue` *(string)*: Queue name.
  - `onMessage` *(function)*: Message handler.

---

### Dead-Letter Methods

- **`setupDeadLetterQueue(queue: string, dlx: string, dlq: string, dlxType?: string, routingKey?: string): Promise<void>`**  
  Sets up a DLQ.  
  - `queue` *(string)*: Main queue.
  - `dlx` *(string)*: Dead-letter exchange.
  - `dlq` *(string)*: Dead-letter queue.
  - `dlxType` *(string, optional)*: DLX type. Default is `"topic"`.
  - `routingKey` *(string, optional)*: Routing key for DLQ. Default is `"#"` (all).

---

### Utility Method

- **`closeConnection(): Promise<void>`**  
  Closes the RabbitMQ connection and channel.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with a clear description.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact

For questions or support, open an issue on the [GitHub repository](https://github.com/gabeodame/rabbitmq-broker) or email `support@anchordiv.com`.
