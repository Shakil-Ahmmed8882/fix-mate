import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";

export const validateRequest = (schema: ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errorDetails = result.error.issues.map((issue) => ({
                field: issue.path.join(".") || "(root)",
                message: issue.message,
            }));

            throw new AppError(400, "Validation failed", errorDetails);
        }

        req.body = result.data;
        next();
    };
};
