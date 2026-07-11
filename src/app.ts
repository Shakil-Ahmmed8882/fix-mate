import cookieParser from "cookie-parser";
import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import config from "./config";
import { routeNotFoundHandler } from "./middlewares/routeNotFoundHanlder.middleware";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.middleware";
import { AuthRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.routes";
import { technicianRoutes } from "./modules/technician/technician.routes";
import { serviceRoutes } from "./modules/service/service.routes";
import { categoryRoutes } from "./modules/category/category.routes";
import { bookingRoutes } from "./modules/booking/booking.routes";
import { paymentRoutes } from "./modules/payment/payment.routes";
import { reviewRoutes } from "./modules/review/review.routes";
import { technicianManagementRoutes } from "./modules/technicianManagement/technicianManagement.routes";
import { adminRoutes } from "./modules/admin/admin.routes";

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
