import { Request, Response } from "express";
import { getDevices, getDeviceStats,getDevicesByMonth,filterDevices} from "../services/deviceService";
import { DeviceStatus } from "@prisma/client";

export const getAllDevices = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const query=req.query?.query as string || ""
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const { devices, total } = await getDevices(page, query,pageSize);
        res.json({
            devices,
            totalPages: Math.ceil(total / pageSize), 
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching devices" });
    }
};



export const getDeviceStatistics = async (req: Request, res: Response) => {
    try {
        const stats = await getDeviceStats();
        res.json(stats);
    } catch (error) {
        console.error("Error fetching device statistics:", error);
        res.status(500).json({ message: "Error fetching device statistics" });
    }
};

export const getDevicesMonth = async (req: Request, res: Response) => {
  try {
    const stats = await getDevicesByMonth();
    res.json(stats);
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques mensuelles :", error);
    res.status(500).json({ message: "Erreur serveur lors du calcul des statistiques" });
  }
};


export const getDevicesByFilters = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, status } = req.query;

        if (!type && !status) {
            res.status(400).json({ message: "Au moins un critère est requis (type ou status)." });
            return;
        }

        const devices = await filterDevices(type as string, status as DeviceStatus);
        res.json(devices);
    } catch (error) {
        console.error("Erreur lors du filtrage :", error);
        res.status(500).json({ message: "Erreur serveur lors du filtrage." });
    }
};
