import { Request, Response } from "express";
import * as userService from "../services/userService";

export const getActiveUsersCount = async (req: Request, res: Response) => {
  try {
    const activeUsersCount = await userService.countActiveUsers();
    res.json({ activeUsersCount });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du comptage des utilisateurs actifs" });
  }
};

export const getInactiveUsersCount = async (req: Request, res: Response) => {
  try {
    const inactiveUsersCount = await userService.countInactiveUsers();
    res.json({ inactiveUsersCount });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors du comptage des utilisateurs inactifs" });
  }
};

export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const { interval = "month" } = req.query;
    //console.log(interval)
    const userStats = await userService.getUserProgress(interval as string);
    res.json(userStats);
  } catch (error:any) {
    res.status(500).json({ error: "Erreur lors de la récupération de la progression des utilisateurs" });
  }
};

export const getBlindUsers = async (req: Request, res: Response) => {
  try {
    const page = +req.query?.page! || 1
    const query = req.query?.query as string || ""
    const blindUsers = await userService.getBlindUsers(page,query);
    res.json(blindUsers);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs malvoyants" });
  }
};

export const addEndUser = async (req: Request, res: Response) => {
  try {
    const { userId, status, helperId, lastPos } = req.body;
    const newEndUser = await userService.addEndUser(userId, status, helperId, lastPos);
    res.status(201).json(newEndUser);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'ajout d'un EndUser" });
  }
};
