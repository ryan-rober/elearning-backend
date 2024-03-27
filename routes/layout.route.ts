import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createLayout, editLayout, getLayout } from "../controllers/layout.controller";

const layoutRouter = express.Router();

layoutRouter.post("/create-layout", isAuthenticated, authorizeRoles("admin"), createLayout);

layoutRouter.put("/edit-layout", isAuthenticated, authorizeRoles("admin"), editLayout);

layoutRouter.get("/get-layout", getLayout);



export default layoutRouter;