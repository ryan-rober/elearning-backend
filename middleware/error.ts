import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Wrong mongodb id error
  if (err.name === "CaseError") {
    const message = `Resource not found, Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate key ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong jwt token
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid JWT token";
    err = new ErrorHandler(message, 400);
  }

  // JWT expired
  if (err.name === "TokenExpiredError") {
    const message = "JWT expired";
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
