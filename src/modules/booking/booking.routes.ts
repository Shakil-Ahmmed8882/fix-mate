import { Router } from "express";
import { bookingController } from "./booking.controller";
import { auth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { Role } from "../../../generated/prisma/enums";
import { createBookingValidation } from "./booking.validation";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(createBookingValidation), bookingController.createBooking);
router.get("/", auth(Role.CUSTOMER), bookingController.getMyBookings);
router.get("/:id", auth(Role.CUSTOMER), bookingController.getSingleBooking);
router.patch("/:id/cancel", auth(Role.CUSTOMER), bookingController.cancelBooking);

export const bookingRoutes = router;
