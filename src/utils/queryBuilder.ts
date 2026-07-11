import type { TMeta } from "./sendResponse";

/**
 * Reusable query builder for list endpoints (pagination + sorting + search + filters).
 *
 * Usage in a service:
 *
 *   const { where, skip, take, orderBy, page, limit } = buildPrismaQuery<TechnicianWhereInput>(query, {
 *       searchableFields: ["name", "bio"],
 *       filterableFields: ["categoryId", "location"],
 *   });
 *
 *   const [data, total] = await prisma.$transaction([
 *       prisma.technician.findMany({ where, skip, take, orderBy }),
 *       prisma.technician.count({ where }),
 *   ]);
 *
 *   return { data, meta: buildMeta(total, page, limit) };
 *
 * Each module decides its own searchableFields / filterableFields — the builder
 * stays generic, the field list is what makes it module-specific.
 */

// ── Types ────────────────────────────────────────────────────────────────

// Query params that are reserved for pagination/sorting/search and must
// never be treated as an exact-match filter field.
const RESERVED_QUERY_KEYS = ["page", "limit", "sortBy", "sortOrder", "searchTerm"];

export type TQueryBuilderOptions = {
    /** Fields to run a case-insensitive "contains" search across, when `searchTerm` is present. */
    searchableFields?: string[];
    /** Whitelist of fields allowed to be used as exact-match filters. */
    filterableFields?: string[];
    defaultSortBy?: string;
    defaultSortOrder?: "asc" | "desc";
    defaultLimit?: number;
};

export type TBuiltPrismaQuery<TWhere> = {
    where: TWhere;
    skip: number;
    take: number;
    orderBy: Record<string, "asc" | "desc">;
    page: number;
    limit: number;
};

// ── Builder ──────────────────────────────────────────────────────────────

export const buildPrismaQuery = <TWhere = Record<string, unknown>>(
    query: Record<string, unknown>,
    options: TQueryBuilderOptions = {}
): TBuiltPrismaQuery<TWhere> => {
    const {
        searchableFields = [],
        filterableFields = [],
        defaultSortBy = "createdAt",
        defaultSortOrder = "desc",
        defaultLimit = 10,
    } = options;

    const { page, limit, skip } = parsePagination(query, defaultLimit);
    const orderBy = parseSorting(query, defaultSortBy, defaultSortOrder);
    const where = buildWhere<TWhere>(query, searchableFields, filterableFields);

    return { where, skip, take: limit, orderBy, page, limit };
};

export const buildMeta = (total: number, page: number, limit: number): TMeta => ({
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
});

// ── Internals ────────────────────────────────────────────────────────────

function parsePagination(query: Record<string, unknown>, defaultLimit: number) {
    const limit = query.limit ? parseInt(query.limit as string) : defaultLimit;
    const page = query.page ? parseInt(query.page as string) : 1;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

function parseSorting(
    query: Record<string, unknown>,
    defaultSortBy: string,
    defaultSortOrder: "asc" | "desc"
) {
    const sortBy = (query.sortBy as string) || defaultSortBy;
    const sortOrder = ((query.sortOrder as string) || defaultSortOrder) as "asc" | "desc";

    return { [sortBy]: sortOrder };
}

// Combines the free-text search block with the exact-match filters into one
// `{ AND: [...] }` where clause. Returns `{}` when there's nothing to filter on.
function buildWhere<TWhere>(
    query: Record<string, unknown>,
    searchableFields: string[],
    filterableFields: string[]
): TWhere {
    const searchCondition = buildSearchCondition(query.searchTerm as string | undefined, searchableFields);
    const filterConditions = buildFilterConditions(query, filterableFields);

    const conditions = [...searchCondition, ...filterConditions];

    return (conditions.length > 0 ? { AND: conditions } : {}) as TWhere;
}

function buildSearchCondition(searchTerm: string | undefined, searchableFields: string[]) {
    if (!searchTerm || searchableFields.length === 0) return [];

    return [
        {
            OR: searchableFields.map((field) => ({
                [field]: { contains: searchTerm, mode: "insensitive" },
            })),
        },
    ];
}

function buildFilterConditions(query: Record<string, unknown>, filterableFields: string[]) {
    return filterableFields
        .filter((field) => !RESERVED_QUERY_KEYS.includes(field) && query[field])
        .map((field) => ({ [field]: query[field] }));
}
