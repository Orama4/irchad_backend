import { Request, Response } from 'express';

import { getZones, getEZonesKPIs, getZoneCountByDate } from '../services/zoneService';


export const getAllZones = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const query = req.query.query as string || ""
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const { zones, total } = await getZones(page,query, pageSize);
        res.status(200).json({
            zones,
            total,
            totalPages: Math.ceil(total / pageSize), 
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getTotalZones = async (req: Request, res: Response) => {
    try {
      const data = await getEZonesKPIs();
      res.status(200).json({ totalZones : data?.totalZones,progressZones:data?.progress });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
};


export const getTotalZonesByDate = async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string); 
    if (isNaN(year)) {
      res.status(400).json({ error: "Year must be a valid number" });
      return; 
    }

    const zonesByDate = await getZoneCountByDate(year);
    res.status(200).json(zonesByDate); 
  } catch (error) {
    res.status(500).json({ error: (error as Error).message }); 
  }
};

