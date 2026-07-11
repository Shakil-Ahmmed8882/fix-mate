import { z } from "zod";

export const createPaymentValidation = z.object({
    bookingId: z.string({ error: "bookingId is required" }).min(1),
});
