import { z } from "zod";

export const updateUserStatusValidation = z.object({
    activeStatus: z.enum(["ACTIVE", "BLOCKED"], { error: "activeStatus must be ACTIVE or BLOCKED" }),
});

export const createCategoryValidation = z.object({
    name: z.string({ error: "name is required" }).trim().min(1, "name cannot be empty").max(100),
    description: z.string().optional(),
});
