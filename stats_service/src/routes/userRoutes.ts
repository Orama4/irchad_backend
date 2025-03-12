import { Router } from "express";
import * as userController from "../controllers/userController";

export const userRoutes = Router();

userRoutes.get("/", userController.getBlindUsers);
userRoutes.get("/active-users/count", userController.getActiveUsersCount);
userRoutes.get("/inactive-users/count", userController.getInactiveUsersCount);
userRoutes.get("/user-progress", userController.getUserProgress);
userRoutes.post("/endUser/add", userController.addEndUser);


