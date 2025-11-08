import Bottleneck from "bottleneck";
import axios from "axios";

const limiter = new Bottleneck({
  reservoir: 1000,         // initial tokens
  reservoirRefreshAmount: 1000,
  reservoirRefreshInterval: 60 * 1000, // per minute
  maxConcurrent: 5,
  minTime: 50
});

const client = axios.create({ timeout: 10_000 });

async function fetchOdds(endpoint: string, apiKey: string) {
  return limiter.schedule(() => client.get(endpoint, { headers: { "API-Key": apiKey } }));
}

export async function pollFeed() {
  // example for Sportradar-like endpoint
  const res = await fetchOdds("https://api.sportradar.com/odds/v1/football/markets", process.env.SPORT_RADAR_KEY!);
  const markets = res.data;
  // normalize and push into sportsbook service via message broker or DB
  return markets;
}
