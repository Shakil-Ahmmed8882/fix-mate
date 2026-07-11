import type { Response } from "express";

export type TMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
};

export type TResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: TMeta;
};

export const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  const { success, statusCode, message, data: result, meta } = data;

  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    meta,
    data: result,
  });
};
