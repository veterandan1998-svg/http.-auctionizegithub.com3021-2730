import { Hono } from "hono";
import { eq, desc, sum, count } from "drizzle-orm";
import { db } from "../database";
import { listings, orders, reviews, userProfile } from "../database/schema";
import { authMiddleware, requireAuth } from "../middleware/auth";

const app = new Hono()
  .use(authMiddleware)
  // GET /dashboard/seller
  .get("/seller", requireAuth, async (c) => {
    const currentUser = c.get("user")!;

    const [stats] = await db.select({
      totalRevenue: sum(orders.sellerPayout),
      totalOrders: count(orders.id),
    }).from(orders).where(eq(orders.sellerId, currentUser.id));

    const [listingStats] = await db.select({
      activeListings: count(listings.id),
    }).from(listings).where(eq(listings.sellerId, currentUser.id));

    const recentOrders = await db.select().from(orders)
      .where(eq(orders.sellerId, currentUser.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    const myListings = await db.select().from(listings)
      .where(eq(listings.sellerId, currentUser.id))
      .orderBy(desc(listings.createdAt))
      .limit(20);

    return c.json({
      totalRevenue: parseFloat(stats?.totalRevenue ?? "0"),
      totalOrders: stats?.totalOrders ?? 0,
      activeListings: listingStats?.activeListings ?? 0,
      recentOrders,
      myListings,
    }, 200);
  })
  // GET /dashboard/buyer
  .get("/buyer", requireAuth, async (c) => {
    const currentUser = c.get("user")!;

    const [stats] = await db.select({
      totalSpent: sum(orders.amount),
      totalOrders: count(orders.id),
    }).from(orders).where(eq(orders.buyerId, currentUser.id));

    const recentOrders = await db.select().from(orders)
      .where(eq(orders.buyerId, currentUser.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return c.json({
      totalSpent: parseFloat(stats?.totalSpent ?? "0"),
      totalOrders: stats?.totalOrders ?? 0,
      recentOrders,
    }, 200);
  });

export default app;
