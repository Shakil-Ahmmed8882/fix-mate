import { z } from "zod";

export const createBookingValidation = z.object({
    serviceId: z.string({ error: "serviceId is required" }).min(1),
    scheduledAt: z.iso.datetime({ error: "scheduledAt must be a valid ISO datetime string" }),
    note: z.string().optional(),
});
