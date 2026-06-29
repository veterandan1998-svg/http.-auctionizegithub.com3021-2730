import { Hono } from "hono";
import { eq, and, like, gte, lte, desc, sql } from "drizzle-orm";
import { db } from "../database";
import { listings, userProfile } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { nanoid } from "nanoid";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";

async function getImageUrls(keys: string[]): Promise<string[]> {
  const urls = await Promise.all(
    keys.map((key) =>
      getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
        { expiresIn: 3600 }
      )
    )
  );
  return urls;
}

const app = new Hono()
  .use(authMiddleware)
  // GET /listings - browse with filters
  .get("/", async (c) => {
    const { category, minPrice, maxPrice, location, search, promoted } = c.req.query();
    let query = db.select({
      listing: listings,
      sellerName: user.name,
      sellerImage: user.image,
    })
      .from(listings)
      .innerJoin(user, eq(listings.sellerId, user.id))
      .where(eq(listings.status, "active"))
      .orderBy(desc(listings.isPromoted), desc(listings.createdAt));

    const conditions = [eq(listings.status, "active")];
    if (category) conditions.push(eq(listings.category, category));
    if (minPrice) conditions.push(gte(listings.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(listings.price, parseFloat(maxPrice)));
    if (location) conditions.push(like(listings.location, `%${location}%`));
    if (search) conditions.push(like(listings.title, `%${search}%`));
    if (promoted === "true") conditions.push(eq(listings.isPromoted, true));

    const rows = await db.select({
      listing: listings,
      sellerName: user.name,
      sellerImage: user.image,
    })
      .from(listings)
      .innerJoin(user, eq(listings.sellerId, user.id))
      .where(and(...conditions))
      .orderBy(desc(listings.isPromoted), desc(listings.createdAt))
      .limit(50);

    const result = await Promise.all(
      rows.map(async (row) => {
        const keys = JSON.parse(row.listing.imageKeys) as string[];
        const imageUrls = keys.length ? await getImageUrls(keys.slice(0, 1)) : [];
        return { ...row.listing, imageUrls, sellerName: row.sellerName, sellerImage: row.sellerImage };
      })
    );
    return c.json(result, 200);
  })
  // GET /listings/:id
  .get("/:id", async (c) => {
    const { id } = c.req.param();
    const rows = await db.select({
      listing: listings,
      sellerName: user.name,
      sellerImage: user.image,
    })
      .from(listings)
      .innerJoin(user, eq(listings.sellerId, user.id))
      .where(eq(listings.id, id))
      .limit(1);

    if (!rows.length) return c.json({ message: "Not found" }, 404);
    const row = rows[0];
    // Increment view count
    await db.update(listings).set({ viewCount: row.listing.viewCount + 1 }).where(eq(listings.id, id));
    const keys = JSON.parse(row.listing.imageKeys) as string[];
    const imageUrls = keys.length ? await getImageUrls(keys) : [];
    return c.json({ ...row.listing, imageUrls, sellerName: row.sellerName, sellerImage: row.sellerImage }, 200);
  })
  // POST /listings - create
  .post("/", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const body = await c.req.json();
    const { title, description, price, category, location, imageKeys } = body;
    if (!title || !description || !price || !category) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    const id = nanoid();
    await db.insert(listings).values({
      id,
      sellerId: currentUser.id,
      title,
      description,
      price: parseFloat(price),
      category,
      location: location || null,
      imageKeys: JSON.stringify(imageKeys || []),
      status: "active",
    });
    // Ensure user has a seller profile
    const existing = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1);
    if (!existing.length) {
      await db.insert(userProfile).values({ id: nanoid(), userId: currentUser.id, role: "seller" });
    } else if (existing[0].role === "buyer") {
      await db.update(userProfile).set({ role: "both" }).where(eq(userProfile.userId, currentUser.id));
    }
    return c.json({ id, message: "Listing created" }, 201);
  })
  // PUT /listings/:id
  .put("/:id", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { id } = c.req.param();
    const existing = await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.sellerId, currentUser.id))).limit(1);
    if (!existing.length) return c.json({ message: "Not found or unauthorized" }, 404);
    const body = await c.req.json();
    const { title, description, price, category, location, imageKeys, status } = body;
    await db.update(listings).set({
      title: title ?? existing[0].title,
      description: description ?? existing[0].description,
      price: price ? parseFloat(price) : existing[0].price,
      category: category ?? existing[0].category,
      location: location !== undefined ? location : existing[0].location,
      imageKeys: imageKeys ? JSON.stringify(imageKeys) : existing[0].imageKeys,
      status: status ?? existing[0].status,
      updatedAt: new Date(),
    }).where(eq(listings.id, id));
    return c.json({ message: "Updated" }, 200);
  })
  // DELETE /listings/:id
  .delete("/:id", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { id } = c.req.param();
    const profile = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1);
    const isAdmin = profile.length && profile[0].role === "admin";
    const row = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    if (!row.length) return c.json({ message: "Not found" }, 404);
    if (row[0].sellerId !== currentUser.id && !isAdmin) return c.json({ message: "Unauthorized" }, 403);
    await db.update(listings).set({ status: "cancelled" }).where(eq(listings.id, id));
    return c.json({ message: "Cancelled" }, 200);
  })
  // GET /listings/seller/:sellerId
  .get("/seller/:sellerId", async (c) => {
    const { sellerId } = c.req.param();
    const rows = await db.select().from(listings).where(eq(listings.sellerId, sellerId)).orderBy(desc(listings.createdAt)).limit(50);
    const result = await Promise.all(
      rows.map(async (row) => {
        const keys = JSON.parse(row.imageKeys) as string[];
        const imageUrls = keys.length ? await getImageUrls(keys.slice(0, 1)) : [];
        return { ...row, imageUrls };
      })
    );
    return c.json(result, 200);
  });

export default app;
