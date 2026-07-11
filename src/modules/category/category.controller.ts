import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CategoryServices } from "./category.services";

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await CategoryServices.getAllCategoriesFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Categories retrieved successfully",
        data,
        meta,
    });
});

export const categoryController = {
    getAllCategories,
};
