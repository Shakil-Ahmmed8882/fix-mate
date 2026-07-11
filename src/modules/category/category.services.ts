import { prisma } from "../../lib/prisma.js";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder.js";
import type { ICategoryQuery } from "./category.interface.js";

const getAllCategoriesFromDB = async (query: ICategoryQuery) => {
    const { where, skip, take, orderBy, page, limit } = buildPrismaQuery(
        query as Record<string, unknown>,
        {
            searchableFields: ["name", "description"],
            defaultSortBy: "name",
            defaultSortOrder: "asc",
        }
    );

    const [categories, total] = await prisma.$transaction([
        prisma.category.findMany({ where, skip, take, orderBy }),
        prisma.category.count({ where }),
    ]);

    return { data: categories, meta: buildMeta(total, page, limit) };
};

export const CategoryServices = {
    getAllCategoriesFromDB,
};
