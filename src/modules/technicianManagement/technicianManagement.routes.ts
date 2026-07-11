import { Router } from "express";
import { technicianManagementController } from "./technicianManagement.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import {
    createServiceValidation,
    updateAvailabilityValidation,
    updateBookingStatusValidation,
    updateServiceValidation,
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

// A technician owns their service listings — create, update, and delete them here.
router.post(
    "/services",
    auth(Role.TECHNICIAN),
    validateRequest(createServiceValidation),
    technicianManagementController.createService
);
router.patch(
    "/services/:id",
    auth(Role.TECHNICIAN),
    validateRequest(updateServiceValidation),
    technicianManagementController.updateMyService
);
router.delete("/services/:id", auth(Role.TECHNICIAN), technicianManagementController.deleteMyService);

export const technicianManagementRoutes = router;
