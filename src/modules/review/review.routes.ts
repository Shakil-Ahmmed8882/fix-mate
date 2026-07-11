import { Router } from "express";
import { reviewController } from "./review.controller";
import { auth } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { Role } from "../../../generated/prisma/enums";
import { createReviewValidation } from "./review.validation";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(createReviewValidation), reviewController.createReview);

export const reviewRoutes = router;
