import { Hono } from "hono";
import { eq, or, desc } from "drizzle-orm";
import { db } from "../database";
import { listings, orders } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import Stripe from "stripe";
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const PLATFORM_FEE = 0.10;

const app = new Hono()
  .use(authMiddleware)
  // POST /orders/checkout - create Stripe checkout session
  .post("/checkout", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { listingId } = await c.req.json();
    if (!listingId) return c.json({ message: "listingId required" }, 400);

    const listingRows = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listingRows.length) return c.json({ message: "Listing not found" }, 404);
    const listing = listingRows[0];
    if (listing.status !== "active") return c.json({ message: "Listing not available" }, 400);
    if (listing.sellerId === currentUser.id) return c.json({ message: "Cannot buy your own listing" }, 400);

    const platformFee = Math.round(listing.price * PLATFORM_FEE * 100);
    const totalCents = Math.round(listing.price * 100);

    const orderId = nanoid();
    const baseUrl = process.env.WEBSITE_URL || "http://localhost:4200";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: listing.title, description: listing.description.slice(0, 200) },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
      },
      success_url: `${baseUrl}/orders/${orderId}?success=true`,
      cancel_url: `${baseUrl}/listings/${listingId}`,
      metadata: { orderId, listingId, buyerId: currentUser.id, sellerId: listing.sellerId },
    });

    // Create pending order
    await db.insert(orders).values({
      id: orderId,
      listingId,
      buyerId: currentUser.id,
      sellerId: listing.sellerId,
      amount: listing.price,
      platformFee: listing.price * PLATFORM_FEE,
      sellerPayout: listing.price * (1 - PLATFORM_FEE),
      stripeSessionId: session.id,
      status: "pending",
    });

    return c.json({ url: session.url, orderId }, 200);
  })
  // POST /orders/webhook - Stripe webhook
  .post("/webhook", async (c) => {
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature");
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return c.json({ message: "Invalid signature" }, 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.CheckoutSession;
      const { orderId, listingId } = session.metadata || {};
      if (orderId) {
        await db.update(orders).set({
          status: "paid",
          stripePaymentIntentId: session.payment_intent as string,
          updatedAt: new Date(),
        }).where(eq(orders.id, orderId));
        if (listingId) {
          await db.update(listings).set({ status: "sold", updatedAt: new Date() }).where(eq(listings.id, listingId));
        }
      }
    }
    return c.json({ received: true }, 200);
  })
  // GET /orders - buyer orders
  .get("/", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { role } = c.req.query();
    let rows;
    if (role === "seller") {
      rows = await db.select({ order: orders, listingTitle: listings.title, buyerName: user.name })
        .from(orders)
        .innerJoin(listings, eq(orders.listingId, listings.id))
        .innerJoin(user, eq(orders.buyerId, user.id))
        .where(eq(orders.sellerId, currentUser.id))
        .orderBy(desc(orders.createdAt));
    } else {
      rows = await db.select({ order: orders, listingTitle: listings.title, sellerName: user.name })
        .from(orders)
        .innerJoin(listings, eq(orders.listingId, listings.id))
        .innerJoin(user, eq(orders.sellerId, user.id))
        .where(eq(orders.buyerId, currentUser.id))
        .orderBy(desc(orders.createdAt));
    }
    return c.json(rows, 200);
  })
  // GET /orders/:id
  .get("/:id", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { id } = c.req.param();
    const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!rows.length) return c.json({ message: "Not found" }, 404);
    const order = rows[0];
    if (order.buyerId !== currentUser.id && order.sellerId !== currentUser.id) {
      return c.json({ message: "Unauthorized" }, 403);
    }
    return c.json(order, 200);
  });

export default app;
