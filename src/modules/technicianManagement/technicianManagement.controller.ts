import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TechnicianManagementServices } from "./technicianManagement.services";

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
    const profile = await TechnicianManagementServices.updateMyProfileIntoDB(req.user!.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Technician profile updated successfully",
        data: profile,
    });
});

const updateAvailability = catchAsync(async (req: Request, res: Response) => {
    const slots = await TechnicianManagementServices.replaceAvailabilityInDB(req.user!.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Availability updated successfully",
        data: slots,
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await TechnicianManagementServices.getMyBookingsFromDB(
        req.user!.userId,
        req.query as Record<string, string>
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Bookings retrieved successfully",
        data,
        meta,
    });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
    const booking = await TechnicianManagementServices.updateBookingStatusIntoDB(
        req.user!.userId,
        req.params.id as string,
        req.body
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking status updated successfully",
        data: booking,
    });
});

export const technicianManagementController = {
    updateMyProfile,
    updateAvailability,
    getMyBookings,
    updateBookingStatus,
};
