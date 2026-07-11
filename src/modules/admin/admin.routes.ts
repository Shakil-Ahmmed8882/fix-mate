import { Router } from "express";
import { adminController } from "./admin.controller";
import { auth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { Role } from "../../../generated/prisma/enums";
import { createCategoryValidation, updateUserStatusValidation } from "./admin.validation";

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
