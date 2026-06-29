import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../database";
import { userProfile } from "../database/schema";
import { user } from "../database/auth-schema";
import { authMiddleware, requireAuth } from "../middleware/auth";
import { nanoid } from "nanoid";

const app = new Hono()
  .use(authMiddleware)
  // GET /profile/:userId
  .get("/:userId", async (c) => {
    const { userId } = c.req.param();
    const userRows = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!userRows.length) return c.json({ message: "User not found" }, 404);
    const profileRows = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
    return c.json({ user: userRows[0], profile: profileRows[0] ?? null }, 200);
  })
  // PUT /profile/me
  .put("/me", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const { bio, location, phone, role, avatarKey } = await c.req.json();
    const existing = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1);
    if (!existing.length) {
      await db.insert(userProfile).values({ id: nanoid(), userId: currentUser.id, role: role ?? "buyer", bio, location, phone, avatarKey });
    } else {
      await db.update(userProfile).set({
        bio: bio ?? existing[0].bio,
        location: location ?? existing[0].location,
        phone: phone ?? existing[0].phone,
        role: role ?? existing[0].role,
        avatarKey: avatarKey ?? existing[0].avatarKey,
      }).where(eq(userProfile.userId, currentUser.id));
    }
    return c.json({ message: "Profile updated" }, 200);
  })
  // GET /profile/me
  .get("/me", requireAuth, async (c) => {
    const currentUser = c.get("user")!;
    const profileRows = await db.select().from(userProfile).where(eq(userProfile.userId, currentUser.id)).limit(1);
    return c.json({ user: currentUser, profile: profileRows[0] ?? null }, 200);
  });

export default app;
