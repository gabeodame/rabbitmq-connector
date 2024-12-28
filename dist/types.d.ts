/**
 * Message handler type for RabbitMQ consumers.
 */
import { Connection, Channel, Message } from "amqplib";
export type { Connection, Channel, Message };
export type PublishOptions = {
    persistent?: boolean;
};
export type ConsumeOptions = {
    noAck?: boolean;
};
