import express, { NextFunction, Request, Response } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";

import morgan from "morgan";
import orderRouter from "./routes/order.router";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.route";
import layoutRouter from "./routes/layout.route";
require("dotenv").config();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));

// Routes
app.use("/api/v1", userRouter);
app.use("/api/v1", courseRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1", notificationRouter);
app.use("/api/v1", analyticsRouter);
app.use("/api/v1", layoutRouter);





// test API
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    msg: "test api sucess",
    data: req.cookies,
  });
});

// unknown api
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  next(err);
});

app.use(ErrorMiddleware);
