import { Router } from "express";

import { AuthController } from "./auth.controller";

const router = Router();

router.post("/login", AuthController.login);

// no auth middleware — reads refreshToken from cookies
router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

export const AuthRoutes = router;
