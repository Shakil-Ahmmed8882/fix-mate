import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import type { ICreateBooking, IBookingQuery } from "./booking.interface.js";

const bookingInclude = {
    service: { include: { category: true } },
    technician: { select: { id: true, name: true, phone: true } },
    customer: { select: { id: true, name: true, phone: true } },
    payment: true,
    review: true,
} as const;

const createBookingIntoDB = async (customerId: string, payload: ICreateBooking) => {
    const service = await prisma.service.findUnique({
        where: { id: payload.serviceId },
    });

    if (!service || !service.isActive) {
        throw new AppError(404, "Service does not exist");
    }

    const booking = await prisma.booking.create({
        data: {
            customerId,
            technicianId: service.technicianId,
            serviceId: service.id,
            scheduledAt: new Date(payload.scheduledAt),
            note: payload.note ?? null,
        },
        include: bookingInclude,
    });

    return booking;
};

const getMyBookingsFromDB = async (customerId: string, query: IBookingQuery) => {
    const { where: queryWhere, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            filterableFields: ["status"],
        }
    );

    const where = { AND: [queryWhere, { customerId }] };

    const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({ where, skip, take, orderBy, include: bookingInclude }),
        prisma.booking.count({ where }),
    ]);

    return { data: bookings, meta: buildMeta(total, page, limit) };
};

const getSingleBookingFromDB = async (customerId: string, id: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: bookingInclude,
    });

    if (!booking) {
        throw new AppError(404, "Booking does not exist");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "You are not authorized to view this booking");
    }

    return booking;
};

// Per spec: a customer may cancel any time before the job reaches IN_PROGRESS.
const CANCELLABLE_STATUSES = ["REQUESTED", "ACCEPTED", "PAID"];

const cancelBookingIntoDB = async (customerId: string, id: string) => {
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
        throw new AppError(404, "Booking does not exist");
    }

    if (booking.customerId !== customerId) {
        throw new AppError(403, "You are not authorized to cancel this booking");
    }

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
        throw new AppError(400, `A booking that is ${booking.status} can no longer be cancelled`);
    }

    const cancelled = await prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: bookingInclude,
    });

    return cancelled;
};

export const BookingServices = {
    createBookingIntoDB,
    getMyBookingsFromDB,
    getSingleBookingFromDB,
    cancelBookingIntoDB,
};
