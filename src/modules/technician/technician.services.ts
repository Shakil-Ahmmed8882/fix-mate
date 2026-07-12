import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import { toRichSlot } from "../../utils/time.js";
import type { ITechnicianQuery } from "./technician.interface.js";

// List stays lean (no slots) to keep payloads small; the single-technician read
// nests availability so a customer can see when that technician is free.
const technicianListInclude = {
    profile: true,
    technicianProfile: true,
} as const;

const getAllTechniciansFromDB = async (query: ITechnicianQuery) => {
    const { where: queryWhere, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            searchableFields: ["name"],
        }
    );

    // Only browsable, non-blocked technicians should ever surface publicly.
    const where = {
        AND: [
            queryWhere,
            { role: "TECHNICIAN" as const, activeStatus: "ACTIVE" as const },
        ],
    };

    const [technicians, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            skip,
            take,
            orderBy,
            omit: { password: true },
            include: technicianListInclude,
        }),
        prisma.user.count({ where }),
    ]);

    return { data: technicians, meta: buildMeta(total, page, limit) };
};

const getSingleTechnicianFromDB = async (id: string) => {
    const technician = await prisma.user.findFirst({
        where: { id, role: "TECHNICIAN" },
        omit: { password: true },
        include: {
            profile: true,
            technicianProfile: {
                include: {
                    availabilitySlots: {
                        orderBy: [{ date: "asc" }, { startTime: "asc" }],
                    },
                },
            },
            servicesOffered: { where: { isActive: true } },
            reviewsReceived: {
                include: {
                    customer: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!technician) {
        throw new AppError(404, "Technician does not exist");
    }

    // Expand the stored 24h slots into the rich (display + dropdown) shape so the
    // public read matches the technician's own GET /api/technician/availability.
    if (technician.technicianProfile) {
        return {
            ...technician,
            technicianProfile: {
                ...technician.technicianProfile,
                availabilitySlots: technician.technicianProfile.availabilitySlots.map(toRichSlot),
            },
        };
    }

    return technician;
};

export const TechnicianServices = {
    getAllTechniciansFromDB,
    getSingleTechnicianFromDB,
};
