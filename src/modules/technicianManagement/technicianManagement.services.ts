import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import type {
    IAvailabilitySlotInput,
    ICreateService,
    ITechnicianBookingQuery,
    IUpdateAvailability,
    IUpdateBookingStatus,
    IUpdateService,
    IUpdateTechnicianProfile,
} from "./technicianManagement.interface.js";

const bookingInclude = {
    service: { include: { category: true } },
    technician: { select: { id: true, name: true, phone: true } },
    customer: { select: { id: true, name: true, phone: true } },
    payment: true,
    review: true,
} as const;

// The only transitions a technician is allowed to make. Anything not listed here
// (e.g. jumping straight from REQUESTED to COMPLETED, or touching a CANCELLED booking)
// is rejected — this table IS the booking state machine from the spec, enforced in code.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    REQUESTED: ["ACCEPTED", "DECLINED"],
    PAID: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
};

const updateMyProfileIntoDB = async (userId: string, payload: IUpdateTechnicianProfile) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!technicianProfile) {
        throw new AppError(404, "Technician profile does not exist");
    }

    const updated = await prisma.technicianProfile.update({
        where: { userId },
        data: payload,
    });

    return updated;
};

const replaceAvailabilityInDB = async (userId: string, payload: IUpdateAvailability) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!technicianProfile) {
        throw new AppError(404, "Technician profile does not exist");
    }

    validateSlots(payload.slots);

    const slots = await prisma.$transaction(async (tx) => {
        await tx.availabilitySlot.deleteMany({ where: { technicianProfileId: technicianProfile.id } });

        await tx.availabilitySlot.createMany({
            data: payload.slots.map((slot) => ({
                technicianProfileId: technicianProfile.id,
                dayOfWeek: slot.dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
            })),
        });

        return tx.availabilitySlot.findMany({
            where: { technicianProfileId: technicianProfile.id },
            orderBy: { dayOfWeek: "asc" },
        });
    });

    return slots;
};

const validateSlots = (slots: IAvailabilitySlotInput[]) => {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    for (const slot of slots) {
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
            throw new AppError(400, "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
        }
        if (!timePattern.test(slot.startTime) || !timePattern.test(slot.endTime)) {
            throw new AppError(400, "startTime/endTime must be in HH:mm 24-hour format");
        }
        if (slot.startTime >= slot.endTime) {
            throw new AppError(400, "startTime must be earlier than endTime");
        }
    }
};

const getMyBookingsFromDB = async (technicianId: string, query: ITechnicianBookingQuery) => {
    const { where: queryWhere, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            filterableFields: ["status"],
        }
    );

    const where = { AND: [queryWhere, { technicianId }] };

    const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({ where, skip, take, orderBy, include: bookingInclude }),
        prisma.booking.count({ where }),
    ]);

    return { data: bookings, meta: buildMeta(total, page, limit) };
};

const updateBookingStatusIntoDB = async (technicianId: string, bookingId: string, payload: IUpdateBookingStatus) => {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
        throw new AppError(404, "Booking does not exist");
    }

    if (booking.technicianId !== technicianId) {
        throw new AppError(403, "You are not authorized to update this booking");
    }

    const allowedNextStatuses = ALLOWED_TRANSITIONS[booking.status] ?? [];
    if (!allowedNextStatuses.includes(payload.status)) {
        throw new AppError(
            400,
            `Cannot move a ${booking.status} booking to ${payload.status}. Allowed next status(es): ${
                allowedNextStatuses.join(", ") || "none"
            }`
        );
    }

    const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: payload.status },
        include: bookingInclude,
    });

    return updated;
};

// ── Service management (a technician's own service listings) ───────────────
// A Service is an offer that belongs to one technician (it carries their
// technicianId + price). So the technician is the owner: they create, update,
// and delete their own listings. Every write here re-checks ownership so one
// technician can never touch another's service.

const serviceOwnerInclude = {
    category: true,
    technician: { select: { id: true, name: true, phone: true } },
} as const;

const createServiceIntoDB = async (technicianId: string, payload: ICreateService) => {
    const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });

    if (!category) {
        throw new AppError(404, "Category does not exist");
    }

    const service = await prisma.service.create({
        data: {
            title: payload.title,
            ...(payload.description !== undefined && { description: payload.description }),
            price: payload.price,
            categoryId: payload.categoryId,
            technicianId,
        },
        include: serviceOwnerInclude,
    });

    return service;
};

const updateMyServiceIntoDB = async (technicianId: string, serviceId: string, payload: IUpdateService) => {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });

    if (!service) {
        throw new AppError(404, "Service does not exist");
    }

    if (service.technicianId !== technicianId) {
        throw new AppError(403, "You are not authorized to update this service");
    }

    // If the category is being changed, make sure the new one actually exists.
    if (payload.categoryId) {
        const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
        if (!category) {
            throw new AppError(404, "Category does not exist");
        }
    }

    const updated = await prisma.service.update({
        where: { id: serviceId },
        data: payload,
        include: serviceOwnerInclude,
    });

    return updated;
};

const deleteMyServiceFromDB = async (technicianId: string, serviceId: string) => {
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { bookings: { select: { id: true }, take: 1 } },
    });

    if (!service) {
        throw new AppError(404, "Service does not exist");
    }

    if (service.technicianId !== technicianId) {
        throw new AppError(403, "You are not authorized to delete this service");
    }

    // A service with booking history can't be hard-deleted (the Booking FK uses
    // onDelete: Restrict, so it would fail anyway). Deactivate it instead — it
    // disappears from public browsing while its bookings keep their record.
    if (service.bookings.length > 0) {
        const deactivated = await prisma.service.update({
            where: { id: serviceId },
            data: { isActive: false },
            include: serviceOwnerInclude,
        });
        return { deactivated: true, service: deactivated };
    }

    await prisma.service.delete({ where: { id: serviceId } });
    return { deactivated: false, service };
};

export const TechnicianManagementServices = {
    updateMyProfileIntoDB,
    replaceAvailabilityInDB,
    getMyBookingsFromDB,
    updateBookingStatusIntoDB,
    createServiceIntoDB,
    updateMyServiceIntoDB,
    deleteMyServiceFromDB,
};
