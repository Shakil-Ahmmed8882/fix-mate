import { z } from "zod";

export const loginValidation = z.object({
    email: z.email("A valid email is required"),
    password: z.string({ error: "password is required" }).min(1, "password is required"),
});
