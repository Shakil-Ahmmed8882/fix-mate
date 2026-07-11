import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminServices } from "./admin.services";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await AdminServices.getAllUsersFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Users retrieved successfully",
        data,
        meta,
    });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const user = await AdminServices.updateUserStatusIntoDB(req.params.id as string, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User status updated successfully",
        data: user,
    });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await AdminServices.getAllBookingsFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bookings retrieved successfully",
        data,
        meta,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await AdminServices.getAllCategoriesFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Categories retrieved successfully",
        data,
        meta,
    });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const category = await AdminServices.createCategoryIntoDB(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category created successfully",
        data: category,
    });
});

export const adminController = {
    getAllUsers,
    updateUserStatus,
    getAllBookings,
    getAllCategories,
    createCategory,
};
