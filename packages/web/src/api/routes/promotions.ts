import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { listings, promotions } from "../database/schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import Stripe from "stripe";
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PROMOTION_TIERS = {
  basic: { amount: 999, days: 7, label: "Basic Boost — 7 days" },
  featured: { amount: 2499, days: 14, label: "Featured — 14 days" },
  premium: { amount: 4999, days: 30, label: "Premium Spotlight — 30 days" },
};

const app = new Hono()
  .use(authMiddleware)
  // GET /promotions/tiers
  .get("/tiers", async (c) => {
    return c.json(PROMOTION_TIERS, 200);
  })
  // POST /promotions/checkout
  .post("/checkout", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { listingId, tier } = await c.req.json();
    if (!listingId || !tier) return c.json({ message: "listingId and tier required" }, 400);
    if (!PROMOTION_TIERS[tier as keyof typeof PROMOTION_TIERS]) return c.json({ message: "Invalid tier" }, 400);

    const listingRows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listingRows.length) return c.json({ message: "Listing not found" }, 404);
    if (listingRows[0].sellerId !== currentUser.id) return c.json({ message: "Unauthorized" }, 403);

    const tierData = PROMOTION_TIERS[tier as keyof typeof PROMOTION_TIERS];
    const promoId = nanoid();
    const baseUrl = process.env.WEBSITE_URL || "http://localhost:4200";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: tierData.label, description: `Boost "${listingRows[0].title}"` },
            unit_amount: tierData.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/listings/${listingId}?promoted=true`,
      cancel_url: `${baseUrl}/listings/${listingId}`,
      metadata: { promoId, listingId, sellerId: currentUser.id, tier, days: tierData.days.toString() },
    });

    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + tierData.days);

    await db.insert(promotions).values({
      id: promoId,
      listingId,
      sellerId: currentUser.id,
      stripeSessionId: session.id,
      tier: tier as "basic" | "featured" | "premium",
      amount: tierData.amount / 100,
      durationDays: tierData.days,
      endsAt,
      status: "pending",
    });

    return c.json({ url: session.url, promoId }, 200);
  })
  // POST /promotions/webhook (Stripe webhook for promotions)
  .post("/webhook", async (c) => {
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature");
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return c.json({ message: "Invalid signature" }, 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { promoId, listingId, days } = session.metadata || {};
      if (promoId) {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + parseInt(days || "7"));
        await db.update(promotions).set({ status: "active", endsAt }).where(eq(promotions.id, promoId));
        await db.update(listings).set({ isPromoted: true, promotedUntil: endsAt, updatedAt: new Date() }).where(eq(listings.id, listingId));
      }
    }
    return c.json({ received: true }, 200);
  });

export default app;
