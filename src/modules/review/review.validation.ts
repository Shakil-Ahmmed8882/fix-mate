import { z } from "zod";

export const createReviewValidation = z.object({
    bookingId: z.string({ error: "bookingId is required" }).min(1),
    rating: z
        .number({ error: "rating is required" })
        .int("rating must be a whole number")
        .min(1, "rating must be between 1 and 5")
        .max(5, "rating must be between 1 and 5"),
    comment: z.string().optional(),
});
