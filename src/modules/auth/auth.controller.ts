import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";

const isProduction = process.env.NODE_ENV === "production";

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
};

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

const login = catchAsync(async (req: Request, res: Response) => {
    const { accessToken, refreshToken, user } = await AuthServices.loginUser(req.body);

    res.cookie("accessToken", accessToken, accessTokenCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User logged in successfully",
        data: { accessToken, refreshToken, user },
    });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    const result = await AuthServices.refreshToken(token);

    res.cookie("accessToken", result.accessToken, accessTokenCookieOptions);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Access token refreshed successfully",
        data: result,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("accessToken", accessTokenCookieOptions);
    res.clearCookie("refreshToken", refreshTokenCookieOptions);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User logged out successfully",
        data: null,
    });
});

export const AuthController = {
    login,
    refreshToken,
    logout,
};
