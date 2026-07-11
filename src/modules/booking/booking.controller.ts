import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingServices } from "./booking.services";

const createBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await BookingServices.createBookingIntoDB(req.user!.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking created successfully",
        data: booking,
    });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await BookingServices.getMyBookingsFromDB(
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

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await BookingServices.getSingleBookingFromDB(req.user!.userId, req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking retrieved successfully",
        data: booking,
    });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
    const booking = await BookingServices.cancelBookingIntoDB(req.user!.userId, req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Booking cancelled successfully",
        data: booking,
    });
});

export const bookingController = {
    createBooking,
    getMyBookings,
    getSingleBooking,
    cancelBooking,
};
