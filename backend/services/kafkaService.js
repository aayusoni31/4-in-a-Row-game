import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "four-in-a-row-server",
  // Brokers list from .env or default to localhost
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  // Add a connection timeout so it doesn't wait forever if Kafka is down
  connectionTimeout: 3000,
});

const producer = kafka.producer();
let isConnected = false;

export const connectKafka = async () => {
  try {
    // Attempt to connect with a 3-second retry limit
    await producer.connect();
    isConnected = true;
    console.log("✅ Kafka Producer Connected");
  } catch (error) {
    isConnected = false;
    console.warn(
      "⚠️ Kafka Connection Failed (Analytics will be disabled). If you want analytics, ensure Kafka is running at localhost:9092."
    );
  }
};

export const sendAnalytics = async (eventType, payload) => {
  // If we aren't connected, we just skip the attempt to prevent console errors
  if (!isConnected) return;

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
    console.log(` Analytics sent to Kafka: ${eventType}`);
  } catch (error) {
    console.error(" Kafka Error:", error.message);
  }
};
