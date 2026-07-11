import bcrypt from "bcryptjs";
import type { SignOptions } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { createToken, verifyToken } from "../../utils/jwt";
import { AppError } from "../../utils/AppError";
import type { ILoginUser } from "./auth.interface";

const loginUser = async (payload: ILoginUser) => {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    if (user.activeStatus === "BLOCKED") {
        throw new AppError(403, "User is blocked");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new AppError(401, "Invalid credentials");
    }

    const jwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_token_secret,
        config.jwt_expires_in as SignOptions["expiresIn"]
    );

    const refreshToken = createToken(
        jwtPayload,
        config.jwt_refresh_token_secret,
        config.jwt_refresh_expires_in as SignOptions["expiresIn"]
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};

const refreshToken = async (token: string) => {
    if (!token) {
        throw new AppError(401, "Refresh token is required");
    }

    const decoded = verifyToken(token, config.jwt_refresh_token_secret);

    const user = await prisma.user.findUnique({
        where: { email: decoded.email },
    });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    if (user.activeStatus === "BLOCKED") {
        throw new AppError(403, "User is blocked");
    }

    const jwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = createToken(
        jwtPayload,
        config.jwt_access_token_secret,
        config.jwt_expires_in as SignOptions["expiresIn"]
    );

    return {
        accessToken,
    };
};

export const AuthServices = {
    loginUser,
    refreshToken,
};
