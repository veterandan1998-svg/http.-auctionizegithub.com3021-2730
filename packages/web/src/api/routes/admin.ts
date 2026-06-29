import { Hono } from "hono";
import { eq, desc, sum, count } from "drizzle-orm";
import { db } from "../database";
import { listings, orders, promotions, userProfile } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";

const ADMIN_EMAILS = ["danieljones@auctionize.com", "admin@auctionize.com"];

const requireAdmin = async (c: any, next: any) => {
  const currentUser = c.get("user");
  if (!currentUser) return c.json({ message: "Unauthorized" }, 401);
  if (!ADMIN_EMAILS.includes(currentUser.email)) {
    return c.json({ message: "Admin only" }, 403);
  }
  return next();
};

const app = new Hono()
  .use(authMiddleware)
  .use(requireAdmin)
  // GET /admin/stats
  .get("/stats", async (c) => {
    const [orderStats] = await db.select({
      totalRevenue: sum(orders.amount),
      platformRevenue: sum(orders.platformFee),
      totalOrders: count(orders.id),
    }).from(orders);

    const [listingStats] = await db.select({ total: count(listings.id) }).from(listings);
    const [userStats] = await db.select({ total: count(user.id) }).from(user);

    return c.json({
      totalRevenue: parseFloat(orderStats?.totalRevenue ?? "0"),
      platformRevenue: parseFloat(orderStats?.platformRevenue ?? "0"),
      totalOrders: orderStats?.totalOrders ?? 0,
      totalListings: listingStats?.total ?? 0,
      totalUsers: userStats?.total ?? 0,
    }, 200);
  })
  // GET /admin/users
  .get("/users", async (c) => {
    const users = await db.select({ user, profile: userProfile })
      .from(user)
      .leftJoin(userProfile, eq(userProfile.userId, user.id))
      .orderBy(desc(user.createdAt))
      .limit(100);
    return c.json(users, 200);
  })
  // GET /admin/listings
  .get("/listings", async (c) => {
    const rows = await db.select().from(listings).orderBy(desc(listings.createdAt)).limit(100);
    return c.json(rows, 200);
  })
  // GET /admin/orders
  .get("/orders", async (c) => {
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    return c.json(rows, 200);
  })
  // DELETE /admin/listings/:id
  .delete("/listings/:id", async (c) => {
    const { id } = c.req.param();
    await db.update(listings).set({ status: "cancelled" }).where(eq(listings.id, id));
    return c.json({ message: "Listing removed" }, 200);
  })
  // GET /admin/promotions
  .get("/promotions", async (c) => {
    const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt)).limit(100);
    return c.json(rows, 200);
  });

export default app;
