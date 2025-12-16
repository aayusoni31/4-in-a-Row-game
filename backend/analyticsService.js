import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "analytics-worker",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "analytics-group" });

const runAnalytics = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "game-analytics", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());

      console.log(" [ANALYTICS EVENT RECEIVED]:", event.event);

      if (event.event === "GAME_FINISHED") {
        console.log(
          ` Game ${event.data.gameId} ended. Winner: ${event.data.winner}`
        );
        // In a real app, you'd save this to an "AnalyticsDB" here
      }
    },
  });
};

runAnalytics().catch(console.error);
