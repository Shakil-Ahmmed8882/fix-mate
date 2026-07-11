import { Router } from "express";
import { userController } from "./users.controller";
import { auth } from "../../middlewares/auth.middleware";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/register", userController.registerUser);

router.get("/me", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), userController.getMyProfile);

router.patch("/update-profile", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), userController.updateMyProfile);

router.patch("/update-password", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), userController.updateMyPassword);

export const userRoutes = router;
