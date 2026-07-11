import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { UserServices } from "./users.services.js";

const registerUser = catchAsync(async (req: Request, res: Response) => {
    const user = await UserServices.registerUserIntoDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User registered successfully",
        data: { user },
    });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = await UserServices.getMyProfileFromDB(req.user!.email);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Profile retrieved successfully",
        data: { user },
    });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const user = await UserServices.updateMyProfileIntoDB(req.user!.email, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Profile updated successfully",
        data: { user },
    });
});

const updateMyPassword = catchAsync(async (req: Request, res: Response) => {
    await UserServices.updateMyPasswordIntoDB(req.user!.email, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Password updated successfully",
        data: null,
    });
});

export const userController = {
    registerUser,
    getMyProfile,
    updateMyProfile,
    updateMyPassword,
};
