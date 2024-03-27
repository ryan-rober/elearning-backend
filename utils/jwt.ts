require("dotenv").config();
import { Response } from "express";
import { redis } from "./redis";
import { IUser } from "../models/user.model";

interface ITokenOptions {
  expire: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}

// Parse environment variables to intergrates with fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "3",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "2",
  10
);
// Options for cookies
export const accessTokenOpions: ITokenOptions = {
  expire: new Date(Date.now() + accessTokenExpire * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOpions: ITokenOptions = {
  expire: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statuscode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  // Upload session to redis
  redis.set(user._id, JSON.stringify(user) as any);

  // only set secure to true in production environment
  if (process.env.NODE_ENV === "production") {
    accessTokenOpions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOpions);
  res.cookie("refresh_token", refreshToken, refreshTokenOpions);

  res.status(200).json({
    success: true,
    user,
    accessToken,
  });
};
