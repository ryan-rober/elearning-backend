import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";

export const getUserById = async (userId: string, res: Response) => {
  const userJson = await redis.get(userId);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

// Get all users
export const getAllUsersService = async(res: Response) => {
  const users = await userModel.find().sort({createAt: -1});

  res.status(201).json({
    success: true,
    users,
  })
}

// Update user role
export const updateUserRoleService = async(res: Response, id: string, role: string) => {
  const user = await userModel.findByIdAndUpdate(id, {role}, {new: true});

  res.status(201).json({
    success: true,
    user,
  })
}
