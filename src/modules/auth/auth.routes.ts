import { Router } from "express";

import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { loginValidation } from "./auth.validation";
import { auth } from "../../middlewares/auth.middleware";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/login", validateRequest(loginValidation), AuthController.login);

// no auth middleware — reads refreshToken from cookies
router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

// Alias for GET /api/users/me, matching the spec's documented endpoint path exactly.
router.get("/me", auth(Role.CUSTOMER, Role.TECHNICIAN, Role.ADMIN), AuthController.getMe);

export const AuthRoutes = router;
