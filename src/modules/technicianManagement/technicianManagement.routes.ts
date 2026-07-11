import { Router } from "express";
import { technicianManagementController } from "./technicianManagement.controller";
import { auth } from "../../middlewares/auth.middleware";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.put("/profile", auth(Role.TECHNICIAN), technicianManagementController.updateMyProfile);
router.put("/availability", auth(Role.TECHNICIAN), technicianManagementController.updateAvailability);
router.get("/bookings", auth(Role.TECHNICIAN), technicianManagementController.getMyBookings);
router.patch("/bookings/:id", auth(Role.TECHNICIAN), technicianManagementController.updateBookingStatus);

export const technicianManagementRoutes = router;
