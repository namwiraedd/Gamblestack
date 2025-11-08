import { pollFeed } from "./connector";
setInterval(async () => {
  try {
    const data = await pollFeed();
    // transform & push to sportsbook via RabbitMQ or HTTP
    console.log("fetched markets count", data.length || 0);
  } catch (e) {
    console.error("odds poll error", e);
  }
}, 10_000); // initial frequency; tune per license
