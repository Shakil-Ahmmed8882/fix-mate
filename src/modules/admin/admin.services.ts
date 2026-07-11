import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import type {
    IAdminBookingQuery,
    IAdminUserQuery,
    ICreateCategory,
    IUpdateUserStatus,
} from "./admin.interface.js";

const getAllUsersFromDB = async (query: IAdminUserQuery) => {
    const { where, skip, take, orderBy, page, limit } = buildPrismaQuery(query as Record<string, unknown>, {
        searchableFields: ["name", "email"],
        filterableFields: ["role"],
    });

    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            skip,
            take,
            orderBy,
            omit: { password: true },
            include: { profile: true, technicianProfile: true },
        }),
        prisma.user.count({ where }),
    ]);

    return { data: users, meta: buildMeta(total, page, limit) };
};

const updateUserStatusIntoDB = async (userId: string, payload: IUpdateUserStatus) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
        throw new AppError(404, "User does not exist");
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { activeStatus: payload.activeStatus },
        omit: { password: true },
    });

    return updated;
};

const bookingInclude = {
    service: { include: { category: true } },
    technician: { select: { id: true, name: true, phone: true } },
    customer: { select: { id: true, name: true, phone: true } },
    payment: true,
    review: true,
} as const;

const getAllBookingsFromDB = async (query: IAdminBookingQuery) => {
    const { where, skip, take, orderBy, page, limit } = buildPrismaQuery(query as Record<string, unknown>, {
        filterableFields: ["status"],
    });

    const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({ where, skip, take, orderBy, include: bookingInclude }),
        prisma.booking.count({ where }),
    ]);

    return { data: bookings, meta: buildMeta(total, page, limit) };
};

const getAllCategoriesFromDB = async (query: Record<string, unknown>) => {
    const { where, skip, take, orderBy, page, limit } = buildPrismaQuery(query, {
        searchableFields: ["name", "description"],
        defaultSortBy: "name",
        defaultSortOrder: "asc",
    });

    const [categories, total] = await prisma.$transaction([
        prisma.category.findMany({ where, skip, take, orderBy }),
        prisma.category.count({ where }),
    ]);

    return { data: categories, meta: buildMeta(total, page, limit) };
};

const createCategoryIntoDB = async (payload: ICreateCategory) => {
    const existing = await prisma.category.findUnique({ where: { name: payload.name } });

    if (existing) {
        throw new AppError(409, "A category with this name already exists");
    }

    const category = await prisma.category.create({ data: payload });

    return category;
};

export const AdminServices = {
    getAllUsersFromDB,
    updateUserStatusIntoDB,
    getAllBookingsFromDB,
    getAllCategoriesFromDB,
    createCategoryIntoDB,
};
