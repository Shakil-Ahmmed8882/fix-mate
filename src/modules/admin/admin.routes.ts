import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middlewares/auth.middleware";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);
router.patch("/users/:id", auth(Role.ADMIN), adminController.updateUserStatus);
router.get("/bookings", auth(Role.ADMIN), adminController.getAllBookings);
router.get("/categories", auth(Role.ADMIN), adminController.getAllCategories);
router.post("/categories", auth(Role.ADMIN), adminController.createCategory);

export const adminRoutes = router;
