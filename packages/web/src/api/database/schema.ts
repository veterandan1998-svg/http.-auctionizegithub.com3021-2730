import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

// Extended user profile
export const userProfile = sqliteTable("user_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  role: text("role", { enum: ["buyer", "seller", "both", "admin"] }).default("buyer").notNull(),
  bio: text("bio"),
  location: text("location"),
  phone: text("phone"),
  avatarKey: text("avatar_key"),
  stripeAccountId: text("stripe_account_id"),
  totalSales: real("total_sales").default(0).notNull(),
  totalEarnings: real("total_earnings").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Listings
export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  sellerId: text("seller_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  category: text("category").notNull(),
  location: text("location"),
  imageKeys: text("image_keys").notNull().default("[]"), // JSON array of S3 keys
  status: text("status", { enum: ["active", "sold", "cancelled", "pending"] }).default("active").notNull(),
  isPromoted: integer("is_promoted", { mode: "boolean" }).default(false).notNull(),
  promotedUntil: integer("promoted_until", { mode: "timestamp_ms" }),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Orders
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  amount: real("amount").notNull(),
  platformFee: real("platform_fee").notNull(), // 10%
  sellerPayout: real("seller_payout").notNull(), // 90%
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  status: text("status", { enum: ["pending", "paid", "completed", "refunded", "cancelled"] }).default("pending").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Conversations (in-app messaging)
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Messages
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  readAt: integer("read_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Reviews
export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  reviewerId: text("reviewer_id").notNull(),
  revieweeId: text("reviewee_id").notNull(),
  listingId: text("listing_id").notNull(),
  orderId: text("order_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

// Promotions (paid listing boosts)
export const promotions = sqliteTable("promotions", {
  id: text("id").primaryKey(),
  listingId: text("listing_id").notNull(),
  sellerId: text("seller_id").notNull(),
  stripeSessionId: text("stripe_session_id"),
  tier: text("tier", { enum: ["basic", "featured", "premium"] }).notNull(),
  amount: real("amount").notNull(),
  durationDays: integer("duration_days").notNull(),
  startsAt: integer("starts_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
  status: text("status", { enum: ["pending", "active", "expired"] }).default("pending").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
