import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../utils/AppError";
import { PaymentServices } from "./payment.services";

const createPayment = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentServices.createPaymentIntoDB(req.user!.userId, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment session created successfully",
        data: result,
    });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        throw new AppError(400, "Missing Stripe signature header");
    }

    const result = await PaymentServices.confirmPaymentFromWebhook(req.body, signature);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment confirmed successfully",
        data: result,
    });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await PaymentServices.getMyPaymentsFromDB(
        req.user!.userId,
        req.query as Record<string, string>
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payments retrieved successfully",
        data,
        meta,
    });
});

const getSinglePayment = catchAsync(async (req: Request, res: Response) => {
    const payment = await PaymentServices.getSinglePaymentFromDB(req.user!.userId, req.params.id as string);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment retrieved successfully",
        data: payment,
    });
});

export const paymentController = {
    createPayment,
    confirmPayment,
    getMyPayments,
    getSinglePayment,
};
