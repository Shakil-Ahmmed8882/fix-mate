import type Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

export const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
        throw new AppError(400, "Missing bookingId in payment session metadata");
    }

    const payment = await prisma.payment.findUnique({ where: { bookingId } });

    if (!payment) {
        console.log(`WEBHOOK: No payment found for booking ${bookingId}`);
        return;
    }

    await prisma.$transaction([
        prisma.payment.update({
            where: { bookingId },
            data: { status: "COMPLETED", paidAt: new Date() },
        }),
        prisma.booking.update({
            where: { id: bookingId },
            data: { status: "PAID" },
        }),
    ]);
};

export const handleCheckoutSessionExpired = async (session: Stripe.Checkout.Session) => {
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
        return;
    }

    const payment = await prisma.payment.findUnique({ where: { bookingId } });

    if (!payment || payment.status !== "PENDING") {
        return;
    }

    await prisma.payment.update({
        where: { bookingId },
        data: { status: "FAILED" },
    });
};
