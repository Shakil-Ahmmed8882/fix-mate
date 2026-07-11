import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewServices } from "./review.services";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const review = await ReviewServices.createReviewIntoDB(req.user!.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Review submitted successfully",
        data: review,
    });
});

export const reviewController = {
    createReview,
};
