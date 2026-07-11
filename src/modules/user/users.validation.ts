import { z } from "zod";

export const registerUserValidation = z.object({
    name: z.string({ error: "name is required" }).trim().min(1, "name cannot be empty").max(255),
    email: z.email("A valid email is required"),
    password: z.string().min(6, "password must be at least 6 characters"),
    phone: z.string().max(20).optional(),
    profilePhoto: z.string().optional(),
    role: z.enum(["CUSTOMER", "TECHNICIAN"], { error: "role must be CUSTOMER or TECHNICIAN" }).optional(),
});

export const updateProfileValidation = z.object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.string().max(20).optional(),
    bio: z.string().optional(),
    profilePhoto: z.string().optional(),
    address: z.string().optional(),
});

export const updatePasswordValidation = z.object({
    oldPassword: z.string().min(1, "oldPassword is required"),
    newPassword: z.string().min(6, "newPassword must be at least 6 characters"),
});
