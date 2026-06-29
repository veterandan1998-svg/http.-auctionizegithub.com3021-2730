import { Hono } from 'hono';
import { cors } from "hono/cors";
import { auth } from "./auth";
import uploadRoutes from "./routes/upload";
import listingsRoutes from "./routes/listings";
import ordersRoutes from "./routes/orders";
import messagesRoutes from "./routes/messages";
import reviewsRoutes from "./routes/reviews";
import promotionsRoutes from "./routes/promotions";
import dashboardRoutes from "./routes/dashboard";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath('api')
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .route('/upload', uploadRoutes)
  .route('/listings', listingsRoutes)
  .route('/orders', ordersRoutes)
  .route('/messages', messagesRoutes)
  .route('/reviews', reviewsRoutes)
  .route('/promotions', promotionsRoutes)
  .route('/dashboard', dashboardRoutes)
  .route('/admin', adminRoutes)
  .route('/profile', profileRoutes);

export type AppType = typeof app;
export default app;
