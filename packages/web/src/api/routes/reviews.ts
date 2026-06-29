import { Hono } from "hono";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { db } from "../database";
import { reviews, orders } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { nanoid } from "nanoid";

const app = new Hono()
  .use(authMiddleware)
  // GET /reviews/:userId
  .get("/:userId", async (c) => {
    const { userId } = c.req.param();
    const rows = await db.select({
      review: reviews,
      reviewerName: user.name,
      reviewerImage: user.image,
    })
      .from(reviews)
      .innerJoin(user, eq(reviews.reviewerId, user.id))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(20);
    const stats = await db.select({
      avgRating: avg(reviews.rating),
      total: count(reviews.id),
    }).from(reviews).where(eq(reviews.revieweeId, userId));
    return c.json({ reviews: rows, avgRating: stats[0]?.avgRating ?? 0, total: stats[0]?.total ?? 0 }, 200);
  })
  // POST /reviews
  .post("/", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { revieweeId, listingId, orderId, rating, comment } = await c.req.json();
    if (!revieweeId || !listingId || !orderId || !rating) return c.json({ message: "Missing fields" }, 400);
    if (rating < 1 || rating > 5) return c.json({ message: "Rating must be 1-5" }, 400);

    // Verify order exists and user is part of it
    const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!orderRows.length) return c.json({ message: "Order not found" }, 404);
    const order = orderRows[0];
    if (order.buyerId !== currentUser.id && order.sellerId !== currentUser.id) {
      return c.json({ message: "Unauthorized" }, 403);
    }
    // Check not already reviewed
    const existing = await db.select().from(reviews)
      .where(and(eq(reviews.orderId, orderId), eq(reviews.reviewerId, currentUser.id))).limit(1);
    if (existing.length) return c.json({ message: "Already reviewed" }, 400);

    const id = nanoid();
    await db.insert(reviews).values({ id, reviewerId: currentUser.id, revieweeId, listingId, orderId, rating, comment });
    return c.json({ id, message: "Review submitted" }, 201);
  });

export default app;
