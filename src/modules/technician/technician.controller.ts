import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianServices } from "./technician.services";

const getAllTechnicians = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await TechnicianServices.getAllTechniciansFromDB(req.query as Record<string, string>);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technicians retrieved successfully",
        data,
        meta,
    });
});

const getSingleTechnician = catchAsync(async (req: Request, res: Response) => {
    const technician = await TechnicianServices.getSingleTechnicianFromDB(req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technician retrieved successfully",
        data: technician,
    });
});

export const technicianController = {
    getAllTechnicians,
    getSingleTechnician,
};
