import { Hono } from "hono";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";
import { requireAuth } from "../middleware/auth";
import { authMiddleware } from "../middleware/auth";

const app = new Hono()
  .use(authMiddleware)
  .post("/presign", requireAuth, async (c) => {
    const { filename, contentType } = await c.req.json();
    const key = `uploads/${Date.now()}-${filename}`;
    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );
    return c.json({ url, key }, 200);
  });

export default app;
