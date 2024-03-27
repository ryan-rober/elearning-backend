import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsynError";
import ErrorHandler from "../utils/ErrorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import OrderModel from "../models/oder.model";


// get users analytics -- admin
export const getUsersAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await generateLast12MonthsData(userModel);

        res.status(200).json({
            success: true,
            users
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
})

// get courses analytics -- admin
export const getCoursesAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const couses = await generateLast12MonthsData(CourseModel);

        res.status(200).json({
            success: true,
            couses
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// get orders analytics -- admin
export const getOrdersAnalytics = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await generateLast12MonthsData(OrderModel);

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 500));
    }
})