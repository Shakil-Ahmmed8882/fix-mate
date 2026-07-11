import { Router } from "express";
import { adminController } from "./admin.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { createCategoryValidation, updateUserStatusValidation } from "./admin.validation.js";

const router = Router();

router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);
router.patch(
    "/users/:id",
    auth(Role.ADMIN),
    validateRequest(updateUserStatusValidation),
    adminController.updateUserStatus
);
router.get("/bookings", auth(Role.ADMIN), adminController.getAllBookings);
router.get("/categories", auth(Role.ADMIN), adminController.getAllCategories);
router.post("/categories", auth(Role.ADMIN), validateRequest(createCategoryValidation), adminController.createCategory);

export const adminRoutes = router;
