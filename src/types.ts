/**
 * Message handler type for RabbitMQ consumers.
 */
import amqp, { Connection, Channel, Message } from "amqplib";

export type { Connection, Channel, Message };

// Additional custom types can go here
export type PublishOptions = {
  persistent?: boolean;
};

export type ConsumeOptions = {
  noAck?: boolean;
};
