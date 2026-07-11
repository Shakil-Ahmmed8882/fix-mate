import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/sendResponse.js";
import { ServiceServices } from "./service.services.js";

const getAllServices = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await ServiceServices.getAllServicesFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Services retrieved successfully",
        data,
        meta,
    });
});

const getSingleService = catchAsync(async (req: Request, res: Response) => {
    const service = await ServiceServices.getSingleServiceFromDB(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Service retrieved successfully",
        data: service,
    });
});

export const serviceController = {
    getAllServices,
    getSingleService,
};
