import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { createPaymentValidation } from "./payment.validation.js";

const router = Router();

router.post("/create", auth(Role.CUSTOMER), validateRequest(createPaymentValidation), paymentController.createPayment);

// Stripe webhook — no auth middleware, verified via Stripe signature instead. Raw body is
// registered in app.ts before express.json() so the signature check has the untouched payload.
router.post("/confirm", paymentController.confirmPayment);

router.get("/", auth(Role.CUSTOMER), paymentController.getMyPayments);
router.get("/:id", auth(Role.CUSTOMER), paymentController.getSinglePayment);

export const paymentRoutes = router;
