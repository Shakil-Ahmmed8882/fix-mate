import type { NextFunction, RequestHandler } from "express";


export const catchAsync = (fn: RequestHandler) => {
    return async (req: any, res: any, next: NextFunction) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    }
}
