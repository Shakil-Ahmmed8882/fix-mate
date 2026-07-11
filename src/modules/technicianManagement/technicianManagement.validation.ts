import { z } from "zod";

export const updateTechnicianProfileValidation = z.object({
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
});

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateAvailabilityValidation = z.object({
    slots: z.array(
        z.object({
            dayOfWeek: z.number().int().min(0, "dayOfWeek must be between 0 and 6").max(6, "dayOfWeek must be between 0 and 6"),
            startTime: z.string().regex(timePattern, "startTime must be in HH:mm 24-hour format"),
            endTime: z.string().regex(timePattern, "endTime must be in HH:mm 24-hour format"),
        })
    ),
});

export const updateBookingStatusValidation = z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"], {
        error: "status must be one of ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED",
    }),
});
