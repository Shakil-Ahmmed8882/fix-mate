import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder";
import type { ICreatePayment, IPaymentQuery } from "./payment.interface";
import { handleCheckoutSessionCompleted, handleCheckoutSessionExpired } from "./payment.utils";

const createPaymentIntoDB = async (customerId: string, payload: ICreatePayment) => {
    const booking = await prisma.booking.findUnique({
        where: { id: payload.bookingId },
        include: { service: true, payment: true },
    });

    if (!booking) {
        throw new AppError(404, "Booking does not exist");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "You are not authorized to pay for this booking");
    }

    if (booking.status !== "ACCEPTED") {
        throw new AppError(400, "Only an accepted booking can be paid for");
    }

    if (booking.payment) {
        throw new AppError(409, "A payment already exists for this booking");
    }

    const amount = booking.service.price;

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: { name: booking.service.title },
                    unit_amount: Math.round(Number(amount) * 100),
                },
                quantity: 1,
            },
        ],
        metadata: { bookingId: booking.id },
        success_url: `${config.app_frontend_url}/bookings/${booking.id}?payment=success`,
        cancel_url: `${config.app_frontend_url}/bookings/${booking.id}?payment=cancelled`,
    });

    const payment = await prisma.payment.create({
        data: {
            bookingId: booking.id,
            amount,
            provider: "STRIPE",
            transactionId: session.id,
        },
    });

    return { checkoutUrl: session.url, payment };
};

const confirmPaymentFromWebhook = async (rawBody: Buffer, signature: string) => {
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe_webhook_secret);
    } catch (err) {
        throw new AppError(400, "Invalid webhook signature");
    }

    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
            break;
        case "checkout.session.expired":
            await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session);
            break;
        default:
            console.log(`Unhandled event type. No event matched ${event.type}.`);
            break;
    }

    return { received: true };
};

const getMyPaymentsFromDB = async (customerId: string, query: IPaymentQuery) => {
    const { where: queryWhere, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            filterableFields: ["status"],
        }
    );

    const where = { AND: [queryWhere, { booking: { customerId } }] };

    const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({ where, skip, take, orderBy, include: { booking: true } }),
        prisma.payment.count({ where }),
    ]);

    return { data: payments, meta: buildMeta(total, page, limit) };
};

const getSinglePaymentFromDB = async (customerId: string, id: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: { booking: true },
    });

    if (!payment) {
        throw new AppError(404, "Payment does not exist");
    }

    if (payment.booking.customerId !== customerId) {
        throw new AppError(403, "You are not authorized to view this payment");
    }

    return payment;
};

export const PaymentServices = {
    createPaymentIntoDB,
    confirmPaymentFromWebhook,
    getMyPaymentsFromDB,
    getSinglePaymentFromDB,
};
