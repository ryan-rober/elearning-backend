import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsynError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCoure, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import { IUser } from "../models/user.model";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs"
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";

declare module "express" {
  interface Request {
    user?: IUser;
  }
}

// Upload course
export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: (await myCloud).public_id,
          url: (await myCloud).secure_url,
        };
      }
      createCoure(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Edit course
export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const myCloud = cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: (await myCloud).public_id,
          url: (await myCloud).secure_url,
        };
      }

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get single course --- without puchasing
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);

      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);

        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await CourseModel.findById(courseId).select(
          "-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions"
        );

        await redis.set(courseId, JSON.stringify(course), "EX", 60 * 60 * 24 * 7);

        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get all course --- without puchasing
export const getAllCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isCacheExist = await redis.get("allCourses");
      if (isCacheExist) {
        const courses = JSON.parse(isCacheExist);

        res.status(200).json({
          success: true,
          courses,
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.links -courseData.suggestion -courseData.questions"
        );

        await redis.set("allCourses", JSON.stringify(courses));

        res.status(200).json({
          success: true,
          courses,
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get course content -- only for valid user
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;

      console.log(req.user);

      const courseExist = userCourseList?.find(
        (course: any) => course._id === courseId
      );

      if (!courseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }

      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;

      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Add question
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { question, courseId, contentId }: IAddQuestionData = req.body;
    const course = await CourseModel.findById(courseId);

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    const courseContent = course?.courseData?.find((item: any) =>
      item._id.equals(contentId)
    );

    if (!courseContent) {
      return next(new ErrorHandler("Invalid content id", 400));
    }

    // Create new question
    const newQuestion: any = {
      user: req.user,
      question,
      questionReplies: [],
    };

    // Add this question to course content
    courseContent.questions.push(newQuestion);

    // Save the updated course
    course?.save();

    res.status(200).json({
      success: true,
      course,
    });
  }
);

// Add answer
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData =
        req.body;
      const course = await CourseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent.questions?.find((item) =>
        item._id.equals(questionId)
      );

      if(!question){
        return next(new ErrorHandler("Invalid question id", 400));
      }

      // Create new answer
      const newAnswer: any = {
        user: req.user,
        answer
      }

      // Add this answer to course content
      question.questionReplies?.push(newAnswer);

      await course?.save();

      if(req.user?.id === question.user.id){
        // Create notification
        NotificationModel.create({
          userId: req?.user?._id,
          title: "New question reply received",
          message: `You hava a new question reply in ${courseContent.title}`
        })
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        }

        const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question reply",
            template: "question-reply",
            data
          })
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500))
        }
      }

      res.status(200).json({
        success: true,
        course
      })
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);


// Add review 
interface IAddReviewData {
  review: string,
  courseId: string,
  rating: number,
  userId: string,
}

export const addReview = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const userCourseList = req.user?.courses;

    const courseId = req.params.id;

    // Check if courseId already exist in userCourseList
    const courseExist = userCourseList?.some((course:any) => course._id.toString() === courseId.toString());

    if(!courseExist) {
      return next(new ErrorHandler("You are not eligible to access this course", 404));
    }

    const course = await CourseModel.findById(courseId);

    if(!course) {
      return next(new ErrorHandler("Invalid course id", 404));
    }

    const {review, rating} = req.body as IAddReviewData;

    const reviewData: any = {
      user: req.user,
      rating,
      comment: review,
    }

    course?.reviews.push(reviewData)

    let avg = 0;

    course.reviews.forEach((item) => avg += item.rating)

    course.ratings = avg / course.reviews.length;

    course?.save();

    // Create notification
    const notification = {
      title: "New course review",
      message: `${req.user?.name} has given a review in ${course.name}`
    }

    // Notification handle

    res.status(200).json({
      success: true,
      course
    })

  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// add reply in review
interface IAddReviewData {
  comment: string,
  courseId: string,
  reviewId: string
}

export const addReplyToReview = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { comment, courseId, reviewId} = req.body as IAddReviewData;

    const course = await CourseModel.findById(courseId);

    if(!course) {
      return next(new ErrorHandler("Course not found", 404));
    }

    const review = course.reviews.find((rev) => rev._id.toString() === reviewId.toString());

    if(!review) {
      return next(new ErrorHandler("Review not found", 404))
    }

    const replyData:any = {
      user: req.user,
      comment,
    }

    review.commentReplies.push(replyData);

    await course?.save();

    res.status(200).json({
      success: true,
      course
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})


// get all courses
export const getAllCourses = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    getAllCoursesService(res);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

// delete course
export const deleteCourse = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params;
    const course =  await CourseModel.findById(id);
    if(!course) {
      return next(new ErrorHandler("course not found", 404));
    }

    await course.deleteOne({id});
    await redis.del(id);

    res.status(200).json({
      success: true,
      message: "course deleted successfully"
    })
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400))
  }
})