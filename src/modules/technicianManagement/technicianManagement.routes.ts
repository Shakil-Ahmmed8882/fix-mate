import { Router } from "express";
import { technicianManagementController } from "./technicianManagement.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
    updateAvailabilityValidation,
    updateBookingStatusValidation,
    updateTechnicianProfileValidation,
} from "./technicianManagement.validation.js";

const router = Router();

router.put(
    "/profile",
    auth(Role.TECHNICIAN),
    validateRequest(updateTechnicianProfileValidation),
    technicianManagementController.updateMyProfile
);
router.put(
    "/availability",
    auth(Role.TECHNICIAN),
    validateRequest(updateAvailabilityValidation),
    technicianManagementController.updateAvailability
);
router.get("/bookings", auth(Role.TECHNICIAN), technicianManagementController.getMyBookings);
router.patch(
    "/bookings/:id",
    auth(Role.TECHNICIAN),
    validateRequest(updateBookingStatusValidation),
    technicianManagementController.updateBookingStatus
);

export const technicianManagementRoutes = router;
