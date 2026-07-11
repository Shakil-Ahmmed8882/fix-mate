import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";
import type { Role } from "../../generated/prisma/client";

// Make `req.user` available across the app without type errors.
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const auth = (...roles: Role[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token =
                req.cookies?.accessToken ||
                req.headers.authorization?.split(" ")[1];

            if (!token) {
                throw new AppError(401, "You are not authorized");
            }

            const decoded = verifyToken(token, config.jwt_access_token_secret);

            const user = await prisma.user.findUnique({
                where: { email: decoded.email },
            });

            if (!user) {
                throw new AppError(404, "User does not exist");
            }

            if (user.activeStatus === "BLOCKED") {
                throw new AppError(403, "User is blocked");
            }

            if (roles.length && !roles.includes(user.role)) {
                throw new AppError(403, "You are not authorized");
            }

            req.user = decoded;
            next();
        } catch (error) {
            next(error);
        }
    };
};
