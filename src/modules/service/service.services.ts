import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import type { IServiceQuery } from "./service.interface.js";

const serviceListInclude = {
    category: true,
    technician: {
        omit: { password: true },
        include: { profile: true, technicianProfile: true },
    },
} as const;

const getAllServicesFromDB = async (query: IServiceQuery) => {
    const { where: queryWhere, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            searchableFields: ["title", "description"],
            filterableFields: ["categoryId"],
        }
    );

    // Public browsing should never surface services a technician has turned off.
    const where = { AND: [queryWhere, { isActive: true }] };

    const [services, total] = await prisma.$transaction([
        prisma.service.findMany({ where, skip, take, orderBy, include: serviceListInclude }),
        prisma.service.count({ where }),
    ]);

    return { data: services, meta: buildMeta(total, page, limit) };
};

const getSingleServiceFromDB = async (id: string) => {
    const service = await prisma.service.findUnique({
        where: { id },
        include: serviceListInclude,
    });

    if (!service) {
        throw new AppError(404, "Service does not exist");
    }

    return service;
};

export const ServiceServices = {
    getAllServicesFromDB,
    getSingleServiceFromDB,
};
