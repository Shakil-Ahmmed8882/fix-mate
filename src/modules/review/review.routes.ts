import { Router } from "express";
import { reviewController } from "./review.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validateRequest.middleware.js";
import { Role } from "../../../generated/prisma/enums.js";
import { createReviewValidation } from "./review.validation.js";

const router = Router();

router.post("/", auth(Role.CUSTOMER), validateRequest(createReviewValidation), reviewController.createReview);

export const reviewRoutes = router;
