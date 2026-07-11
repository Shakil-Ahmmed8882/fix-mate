import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateReview } from "./review.interface";

const createReviewIntoDB = async (customerId: string, payload: ICreateReview) => {
    const { bookingId, rating, comment } = payload;

    if (rating < 1 || rating > 5) {
        throw new AppError(400, "Rating must be between 1 and 5");
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { review: true },
    });

    if (!booking) {
        throw new AppError(404, "Booking does not exist");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "You are not authorized to review this booking");
    }

    if (booking.status !== "COMPLETED") {
        throw new AppError(400, "Only a completed booking can be reviewed");
    }

    if (booking.review) {
        throw new AppError(409, "This booking has already been reviewed");
    }

    const review = await prisma.review.create({
        data: {
            bookingId,
            rating,
            comment: comment ?? null,
            customerId,
            technicianId: booking.technicianId,
        },
    });

    return review;
};

export const ReviewServices = {
    createReviewIntoDB,
};
