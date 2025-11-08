import express from "express";
import Stripe from "stripe";
import { idempotencyHandler } from "../middleware/idempotency";
const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2022-11-15" });
const router = express.Router();

router.post("/stripe", express.raw({ type: "application/json" }), idempotencyHandler, async (req, res) => {
  const sig = req.headers['stripe-signature'] as string | undefined;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig!, process.env.STRIPE_ENDPOINT_SECRET!);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  // handle event types...
  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;
    // create ledger entry, mark deposit cleared, etc.
  }
  // optionally save idempotent result via utils
  res.json({ received: true });
});

export default router;
