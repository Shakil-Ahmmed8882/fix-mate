import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import {
    formatSlotHuman,
    parseAmPmTo24,
    toRichSlot,
    todayDateOnly,
} from "../../utils/time.js";
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

const availabilityOrderBy = [{ date: "asc" as const }, { startTime: "asc" as const }];

const replaceAvailabilityInDB = async (userId: string, payload: IUpdateAvailability) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!technicianProfile) {
        throw new AppError(404, "Technician profile does not exist");
    }

    // Semantic checks (past date, overlap) run BEFORE the transaction, so a bad
    // payload never wipes the technician's existing slots.
    detectSemanticSlotErrors(payload.slots);

    const slots = await prisma.$transaction(async (tx) => {
        await tx.availabilitySlot.deleteMany({ where: { technicianProfileId: technicianProfile.id } });

        await tx.availabilitySlot.createMany({
            data: payload.slots.map((slot) => ({
                technicianProfileId: technicianProfile.id,
                date: new Date(`${slot.date}T00:00:00Z`),
                startTime: parseAmPmTo24(slot.startTime),
                endTime: parseAmPmTo24(slot.endTime),
            })),
        });

        return tx.availabilitySlot.findMany({
            where: { technicianProfileId: technicianProfile.id },
            orderBy: availabilityOrderBy,
        });
    });

    return slots.map(toRichSlot);
};

const getMyAvailabilityFromDB = async (userId: string) => {
    const technicianProfile = await prisma.technicianProfile.findUnique({ where: { userId } });

    if (!technicianProfile) {
        throw new AppError(404, "Technician profile does not exist");
    }

    const slots = await prisma.availabilitySlot.findMany({
        where: { technicianProfileId: technicianProfile.id },
        orderBy: availabilityOrderBy,
    });

    return slots.map(toRichSlot);
};

// Structural checks (date/time format, endTime > startTime, min 1) live in zod.
// This handles the two semantic rules that need runtime state and a readable,
// slot-naming error: no past dates, and no overlaps within the submitted set.
const detectSemanticSlotErrors = (slots: IAvailabilitySlotInput[]) => {
    // 1. Past dates — reject any slot dated before the server's today.
    const today = todayDateOnly();
    const pastSlots = slots.filter((slot) => new Date(`${slot.date}T00:00:00Z`) < today);
    if (pastSlots.length > 0) {
        throw new AppError(
            400,
            "Slot date is in the past",
            pastSlots.map((slot) => ({
                slot: formatSlotHuman(slot.date, parseAmPmTo24(slot.startTime), parseAmPmTo24(slot.endTime)),
            }))
        );
    }

    // 2. Overlaps — two slots conflict if they share a date and their [start, end)
    // time ranges intersect. Sort so conflicts sit next to each other, then check
    // every same-date pair and collect ALL conflicting pairs (not just the first)
    // so the tester sees exactly which slots collided.
    const normalized = slots
        .map((slot) => ({
            date: slot.date,
            start: parseAmPmTo24(slot.startTime),
            end: parseAmPmTo24(slot.endTime),
        }))
        .sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));

    const conflicts: { slot: string; conflictsWith: string }[] = [];
    for (let i = 0; i < normalized.length; i++) {
        const a = normalized[i]!;
        for (let j = i + 1; j < normalized.length; j++) {
            const b = normalized[j]!;
            if (a.date !== b.date) break; // sorted — no more same-date slots ahead
            // half-open [start, end): touching endpoints (12:00 end / 12:00 start) do NOT overlap
            if (a.start < b.end && b.start < a.end) {
                conflicts.push({
                    slot: formatSlotHuman(a.date, a.start, a.end),
                    conflictsWith: formatSlotHuman(b.date, b.start, b.end),
                });
            }
        }
    }

    if (conflicts.length > 0) {
        throw new AppError(400, "Slot overlaps with an existing slot", conflicts);
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
    getMyAvailabilityFromDB,
    getMyBookingsFromDB,
    updateBookingStatusIntoDB,
    createServiceIntoDB,
    updateMyServiceIntoDB,
    deleteMyServiceFromDB,
};
