import express from 'express'
import { authorizeRoles, isAuthenticated } from '../middleware/auth'
import { getAllNotification, updateNotification } from '../controllers/notification.controller'

const notificationRouter = express.Router()

notificationRouter.get("/get-all-notifications", isAuthenticated, authorizeRoles("admin"), getAllNotification);

notificationRouter.put("/update-notification/:id", isAuthenticated, authorizeRoles("admin"), updateNotification);


export default notificationRouter;