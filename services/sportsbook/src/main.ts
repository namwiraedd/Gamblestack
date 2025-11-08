import express from "express";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
dotenv.config();
const app = express();
app.use(express.json());

// sample market
let markets = [
  { id: "m1", sport: "football", teams: ["Team A","Team B"], odds: { "1": 1.75, "X": 3.2, "2": 4.5 }, status: "open" }
];

app.get("/markets", (req, res) => res.json(markets));

app.post("/place", (req, res) => {
  const { user_id, market_id, stake, selection } = req.body;
  const market = markets.find(m => m.id === market_id);
  if (!market) return res.status(400).json({ error: "unknown market" });
  // trivial validation
  const bet = { id: uuidv4(), user_id, market_id, stake, selection, potential_win: stake * market.odds[selection], status: "placed", placed_at: new Date().toISOString() };
  // In real system: reserve funds via wallet service & emit events to broker
  res.json(bet);
});

const port = 4003;
app.listen(port, () => console.log(`Sportsbook on ${port}`));
