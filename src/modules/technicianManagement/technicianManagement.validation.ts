import { z } from "zod";
import { parseAmPmTo24 } from "../../utils/time.js";

export const updateTechnicianProfileValidation = z.object({
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
});

// 12-hour clock, e.g. "09:00 AM" / "05:30 PM". The hour group (0[1-9]|1[0-2])
// plus the mandatory " AM/PM" suffix makes malformed inputs like "017:00" or
// "13:00 PM" impossible.
const timePattern12 = /^(0[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// A YYYY-MM-DD string that also names a real calendar day (rejects 2026-02-30,
// 2026-13-01, etc.) — round-tripping through Date and comparing back catches
// anything that overflowed.
const isRealCalendarDate = (value: string): boolean => {
    const parts = value.split("-").map(Number);
    const [y, m, d] = parts as [number, number, number];
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

export const updateAvailabilityValidation = z.object({
    slots: z
        .array(
            z
                .object({
                    date: z
                        .string()
                        .regex(datePattern, "date must be in YYYY-MM-DD format")
                        .refine(isRealCalendarDate, "date is not a real calendar date"),
                    startTime: z.string().regex(timePattern12, 'startTime must be like "09:00 AM"'),
                    endTime: z.string().regex(timePattern12, 'endTime must be like "05:00 PM"'),
                })
                // An object-level refine still runs even when the field regexes
                // above failed, so guard the parse — a malformed time should
                // surface as the regex error, not throw here.
                .refine(
                    (slot) => {
                        try {
                            return parseAmPmTo24(slot.endTime) > parseAmPmTo24(slot.startTime);
                        } catch {
                            return true; // let the field-level regex report the format error
                        }
                    },
                    { message: "endTime must be after startTime", path: ["endTime"] }
                )
        )
        .min(1, "Provide at least one slot (this replaces all existing slots)."),
});

export const updateBookingStatusValidation = z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"], {
        error: "status must be one of ACCEPTED, DECLINED, IN_PROGRESS, COMPLETED",
    }),
});

export const createServiceValidation = z.object({
    title: z.string().min(1, "title is required").max(255),
    description: z.string().optional(),
    price: z.number().positive("price must be greater than 0"),
    categoryId: z.string().min(1, "categoryId is required"),
});

export const updateServiceValidation = z
    .object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        price: z.number().positive("price must be greater than 0").optional(),
        categoryId: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided to update",
    });
