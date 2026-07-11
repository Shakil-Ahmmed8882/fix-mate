import { Router } from "express";
import { userController } from "./users.controller";
import { auth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { Role } from "../../../generated/prisma/enums";
import { registerUserValidation, updatePasswordValidation, updateProfileValidation } from "./users.validation";

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
