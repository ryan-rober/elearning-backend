import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsynError";
import ErrorHandler from "../utils/ErrorHandler";
import { IOrder } from "../models/oder.model";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import { getAllOrdersService, newOrder } from "../services/order.service";
import path from "path";
import ejs from "ejs"
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";


// Create order
export const createOrder = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const {courseId, payment_info} = req.body as IOrder

        const user = await userModel.findById(req.user?._id)


        const courseExistInUser = user?.courses.some((course:any) => course._id.toString() === courseId.toString());

        if(courseExistInUser) {
            return next(new ErrorHandler("You are already enroll this course", 400))
        }

        const course = await CourseModel.findById(courseId);

        if(!course) {
            return next(new ErrorHandler("Course not found", 404));
        }

        const data: any = {
            userId: user?._id,
            courseId: course._id,
            payment_info
        }

        

        const mailData = {
            order : {
                _id: course._id.toString(),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {year: "numeric", month: "long", day: "numeric"})
            }
        }

        const html = await ejs.renderFile(path.join(__dirname, "../mails/order-confirmation.ejs"), {order: mailData})

        try {
            if(user) {
            await sendMail({
                email: user.email,
                subject: "Order confirmation",
                template: "order-confirmation.ejs",
                data: mailData,
            })
            }
        } catch (error:any) {
            return next(new ErrorHandler(error.message, 500))
        }

        user?.courses.push(course._id);
        await user?.save();

        course.purchased ? course.purchased + 1: course.purchased;
        await course?.save()

        await NotificationModel.create({
            userId: user?._id,
            title: "New order",
            message: `You have a new order from ${course.name}`
        })

        newOrder(data, res, next)

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400))
    }
})


// get all orders
export const getAllOrders = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400))
    }
  })