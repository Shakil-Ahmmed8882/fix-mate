import { Router } from "express";
import { reviewController } from "./review.controller";
import { auth } from "../../middlewares/auth.middleware";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.CUSTOMER), reviewController.createReview);

export const reviewRoutes = router;
