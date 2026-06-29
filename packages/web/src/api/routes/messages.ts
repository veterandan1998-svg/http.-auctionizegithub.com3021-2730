import { Hono } from "hono";
import { eq, and, or, desc } from "drizzle-orm";
import { db } from "../database";
import { conversations, messages, listings } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { nanoid } from "nanoid";

const app = new Hono()
  .use(authMiddleware)
  // GET /messages/conversations
  .get("/conversations", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const rows = await db.select({
      conversation: conversations,
      listingTitle: listings.title,
      buyerName: user.name,
    })
      .from(conversations)
      .innerJoin(listings, eq(conversations.listingId, listings.id))
      .innerJoin(user, or(
        and(eq(conversations.buyerId, currentUser.id), eq(user.id, conversations.sellerId)),
        and(eq(conversations.sellerId, currentUser.id), eq(user.id, conversations.buyerId))
      ))
      .where(or(eq(conversations.buyerId, currentUser.id), eq(conversations.sellerId, currentUser.id)))
      .orderBy(desc(conversations.lastMessageAt));
    return c.json(rows, 200);
  })
  // POST /messages/conversations - start or get a conversation
  .post("/conversations", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { listingId, sellerId } = await c.req.json();
    if (!listingId || !sellerId) return c.json({ message: "listingId and sellerId required" }, 400);
    if (currentUser.id === sellerId) return c.json({ message: "Cannot message yourself" }, 400);

    // Check if conversation exists
    const existing = await db.select().from(conversations)
      .where(and(
        eq(conversations.listingId, listingId),
        eq(conversations.buyerId, currentUser.id),
        eq(conversations.sellerId, sellerId)
      )).limit(1);

    if (existing.length) return c.json(existing[0], 200);

    const id = nanoid();
    await db.insert(conversations).values({
      id,
      listingId,
      buyerId: currentUser.id,
      sellerId,
    });
    return c.json({ id }, 201);
  })
  // GET /messages/:conversationId
  .get("/:conversationId", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { conversationId } = c.req.param();
    const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conv.length) return c.json({ message: "Not found" }, 404);
    if (conv[0].buyerId !== currentUser.id && conv[0].sellerId !== currentUser.id) {
      return c.json({ message: "Unauthorized" }, 403);
    }
    // Mark as read
    await db.update(messages).set({ readAt: new Date() })
      .where(and(eq(messages.conversationId, conversationId)));

    const msgs = await db.select({
      message: messages,
      senderName: user.name,
      senderImage: user.image,
    })
      .from(messages)
      .innerJoin(user, eq(messages.senderId, user.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
    return c.json({ conversation: conv[0], messages: msgs }, 200);
  })
  // POST /messages/:conversationId
  .post("/:conversationId", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { conversationId } = c.req.param();
    const { content } = await c.req.json();
    if (!content?.trim()) return c.json({ message: "Content required" }, 400);

    const conv = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
    if (!conv.length) return c.json({ message: "Not found" }, 404);
    if (conv[0].buyerId !== currentUser.id && conv[0].sellerId !== currentUser.id) {
      return c.json({ message: "Unauthorized" }, 403);
    }

    const id = nanoid();
    await db.insert(messages).values({ id, conversationId, senderId: currentUser.id, content: content.trim() });
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));
    return c.json({ id, message: "Sent" }, 201);
  });

export default app;
