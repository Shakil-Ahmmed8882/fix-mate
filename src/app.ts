import cookieParser from "cookie-parser";
import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import config from "./config/index.js";
import { routeNotFoundHandler } from "./middlewares/routeNotFoundHanlder.middleware.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware.js";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/user/user.routes.js";
import { technicianRoutes } from "./modules/technician/technician.routes.js";
import { serviceRoutes } from "./modules/service/service.routes.js";
import { categoryRoutes } from "./modules/category/category.routes.js";
import { bookingRoutes } from "./modules/booking/booking.routes.js";
import { paymentRoutes } from "./modules/payment/payment.routes.js";
import { reviewRoutes } from "./modules/review/review.routes.js";
import { technicianManagementRoutes } from "./modules/technicianManagement/technicianManagement.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";

const app: Application = express();

// Stripe webhook needs the raw body — must be registered before express.json().
app.post("/api/payments/confirm", express.raw({ type: "application/json" }));

app.use(cors({
    origin: config.app_frontend_url,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "FixMate API is running" });
});

// ── Module routes ──────────────────────────────────────────────────────────
// Wire these up as you build each module (follow the PrismaPress module pattern).
app.use('/api/auth', AuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/technician', technicianManagementRoutes);
app.use('/api/admin', adminRoutes);

app.use(routeNotFoundHandler);
app.use(globalErrorHandler);

export default app;
