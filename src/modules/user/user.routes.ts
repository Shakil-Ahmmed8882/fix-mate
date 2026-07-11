import { Router } from "express";
import { userController } from "./users.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { registerUserValidation, updatePasswordValidation, updateProfileValidation } from "./users.validation.js";

const router = Router();

router.post("/register", validateRequest(registerUserValidation), userController.registerUser);

router.get("/me", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), userController.getMyProfile);

router.patch(
    "/update-profile",
    auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
    validateRequest(updateProfileValidation),
    userController.updateMyProfile
);

router.patch(
    "/update-password",
    auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN),
    validateRequest(updatePasswordValidation),
    userController.updateMyPassword
);

export const userRoutes = router;
