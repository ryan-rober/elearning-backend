import { Response } from "express";
import CourseModel from "../models/course.model";
import { CatchAsyncError } from "../middleware/catchAsynError";

// Create coure
export const createCoure = CatchAsyncError(async (data: any, res: Response) => {
  const course = await CourseModel.create(data);
  res.status(200).json({
    success: true,
    course,
  });
});

// Get all courses
export const getAllCoursesService = async(res: Response) => {
  const courses = await CourseModel.find().sort({createAt: -1});

  res.status(201).json({
    success: true,
    courses,
  })
}
