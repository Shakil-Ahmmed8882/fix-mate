import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";

type TErrorResponse = {
    statusCode: number;
    message: string;
    detail?: unknown;
};

const isDev = () => process.env.NODE_ENV !== "production";

const handleKnownRequestError = (err: Prisma.PrismaClientKnownRequestError): TErrorResponse => {
    switch (err.code) {
        case "P2002": {
            const target = (err.meta?.target as string[] | undefined)?.join(", ") || "field";
            return {
                statusCode: 409,
                message: `A record with this ${target} already exists.`,
                detail: err.meta,
            };
        }
        case "P2025":
            return {
                statusCode: 404,
                message: "The requested record was not found.",
                detail: err.meta,
            };
        case "P2003": {
            const field = (err.meta?.field_name as string | undefined) || "related record";
            return {
                statusCode: 400,
                message: `This operation failed because it references a ${field} that does not exist.`,
                detail: err.meta,
            };
        }
        case "P2000": {
            const column = (err.meta?.column_name as string | undefined) || "a field";
            return {
                statusCode: 400,
                message: `The provided value is too long for ${column}.`,
                detail: err.meta,
            };
        }
        case "P2011": {
            const constraint = (err.meta?.constraint as string | undefined) || "a required field";
            return {
                statusCode: 400,
                message: `Missing required value: ${constraint}.`,
                detail: err.meta,
            };
        }
        case "P2014":
            return {
                statusCode: 400,
                message: "This change would violate a required relation between records.",
                detail: err.meta,
            };
        default:
            return {
                statusCode: 400,
                message: `Database request failed (${err.code}).`,
                detail: err.meta,
            };
    }
};

const resolveError = (err: any): TErrorResponse => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        return handleKnownRequestError(err);
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        return {
            statusCode: 400,
            message: "Invalid data provided. Please check your input fields.",
            detail: err.message,
        };
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        return {
            statusCode: 500,
            message: "Could not connect to the database.",
            detail: err.errorCode,
        };
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
        return {
            statusCode: 500,
            message: "A critical database engine error occurred.",
            detail: err.message,
        };
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        return {
            statusCode: 500,
            message: "An unknown database error occurred.",
            detail: err.message,
        };
    }

    return {
        statusCode: err.statusCode || 500,
        message: err.message || "Internal Server Error",
    };
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const { statusCode, message, detail } = resolveError(err);

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(isDev() && { error: detail, stack: err.stack }),
    });
}
