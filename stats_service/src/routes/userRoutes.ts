import { Router } from "express";
import * as userController from "../controllers/userController";

const router = Router();

router.get("/active-users/count", userController.getActiveUsersCount);
router.get("/inactive-users/count", userController.getInactiveUsersCount);
router.get("/user-progress", userController.getUserProgress);
router.get("/blind-users", userController.getBlindUsers);
router.post("/endUser/add", userController.addEndUser);

export default router;
