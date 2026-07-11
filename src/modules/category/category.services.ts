import { prisma } from "../../lib/prisma";
import { buildMeta, buildPrismaQuery } from "../../utils/queryBuilder";
import type { ICategoryQuery } from "./category.interface";

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
