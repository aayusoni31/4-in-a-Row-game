import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "four-in-a-row-server",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"], // Default Kafka port
});

const producer = kafka.producer();

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.log(" Kafka Producer Connected");
  } catch (error) {
    console.log(" Kafka Connection Failed (Analytics will be disabled)");
  }
};

export const sendAnalytics = async (eventType, payload) => {
  try {
    await producer.send({
      topic: "game-analytics",
      messages: [
        {
          value: JSON.stringify({
            event: eventType,
            data: payload,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (error) {
    console.error(" Kafka Error:", error.message);
  }
};
