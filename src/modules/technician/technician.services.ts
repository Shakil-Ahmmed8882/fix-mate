import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder";
import type { ITechnicianQuery } from "./technician.interface";

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
            ...technicianListInclude,
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

    return technician;
};

export const TechnicianServices = {
    getAllTechniciansFromDB,
    getSingleTechnicianFromDB,
};
