import { Router } from "express";
import { bookingController } from "./booking.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { createBookingValidation } from "./booking.validation.js";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(createBookingValidation), bookingController.createBooking);
router.get("/", auth(Role.CUSTOMER), bookingController.getMyBookings);
router.get("/:id", auth(Role.CUSTOMER), bookingController.getSingleBooking);
router.patch("/:id/cancel", auth(Role.CUSTOMER), bookingController.cancelBooking);

export const bookingRoutes = router;
