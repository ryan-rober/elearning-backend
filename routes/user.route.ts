import express from "express";
import {
  registrationUser,
  activationUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/user.controller";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);

userRouter.post("/activate-user", activationUser);

userRouter.post("/login", loginUser);

userRouter.get("/logout", isAuthenticated, logoutUser);

userRouter.get("/refresh", updateAccessToken);

userRouter.get("/me", isAuthenticated, getUserInfo);

userRouter.post("/social-auth", socialAuth);

userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);

userRouter.put("/update-password", isAuthenticated, updatePassword);

userRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture);

userRouter.get("/get-users", isAuthenticated, authorizeRoles("admin"), getAllUsers);

userRouter.put("/update-user", isAuthenticated, authorizeRoles("admin"), updateUserRole);

userRouter.delete("/delete-user/:id", isAuthenticated, authorizeRoles("admin"), deleteUser);




export default userRouter;
