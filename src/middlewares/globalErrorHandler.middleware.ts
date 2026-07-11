import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";

type TErrorResponse = {
    statusCode: number;
    message: string;
    errorDetails: unknown;
};

const isDev = () => process.env.NODE_ENV !== "production";

const handleKnownRequestError = (err: Prisma.PrismaClientKnownRequestError): TErrorResponse => {
    switch (err.code) {
        case "P2002": {
            const target = (err.meta?.target as string[] | undefined)?.join(", ") || "field";
            return {
                statusCode: 409,
                message: `A record with this ${target} already exists.`,
                errorDetails: err.meta ?? null,
            };
        }
        case "P2025":
            return {
                statusCode: 404,
                message: "The requested record was not found.",
                errorDetails: err.meta ?? null,
            };
        case "P2003": {
            const field = (err.meta?.field_name as string | undefined) || "related record";
            return {
                statusCode: 400,
                message: `This operation failed because it references a ${field} that does not exist.`,
                errorDetails: err.meta ?? null,
            };
        }
        case "P2000": {
            const column = (err.meta?.column_name as string | undefined) || "a field";
            return {
                statusCode: 400,
                message: `The provided value is too long for ${column}.`,
                errorDetails: err.meta ?? null,
            };
        }
        case "P2011": {
            const constraint = (err.meta?.constraint as string | undefined) || "a required field";
            return {
                statusCode: 400,
                message: `Missing required value: ${constraint}.`,
                errorDetails: err.meta ?? null,
            };
        }
        case "P2014":
            return {
                statusCode: 400,
                message: "This change would violate a required relation between records.",
                errorDetails: err.meta ?? null,
            };
        default:
            return {
                statusCode: 400,
                message: `Database request failed (${err.code}).`,
                errorDetails: err.meta ?? null,
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
            errorDetails: err.message,
        };
    }

    if (err instanceof Prisma.PrismaClientInitializationError) {
        return {
            statusCode: 500,
            message: "Could not connect to the database.",
            errorDetails: err.errorCode ?? null,
        };
    }

    if (err instanceof Prisma.PrismaClientRustPanicError) {
        return {
            statusCode: 500,
            message: "A critical database engine error occurred.",
            errorDetails: err.message,
        };
    }

    if (err instanceof Prisma.PrismaClientUnknownRequestError) {
        return {
            statusCode: 500,
            message: "An unknown database error occurred.",
            errorDetails: err.message,
        };
    }

    return {
        statusCode: err.statusCode || 500,
        message: err.message || "Internal Server Error",
        errorDetails: err.errorDetails ?? null,
    };
};

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const { statusCode, message, errorDetails } = resolveError(err);

    res.status(statusCode).json({
        success: false,
        message,
        errorDetails,
        ...(isDev() && { stack: err.stack }),
    });
}
