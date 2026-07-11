import type { Request, Response } from "express";


export const routeNotFoundHandler = (req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
            errorDetails: { path: req.originalUrl, timestamp: new Date().toISOString() }
        });
    }
