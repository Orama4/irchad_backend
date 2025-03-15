import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getSalesKPIs = async (req: Request, res: Response) : Promise<void> => {
  try {
    const totalSales = await prisma.sale.count();
    const salesWithDevices = await prisma.sale.findMany({
      include: {
        device: {
          select: {
            price: true,
          },
        },
      },
    });

    const totalRevenue = salesWithDevices.reduce((sum, sale) => {
      return sum + (sale.device?.price || 0);
    }, 0);
    const totalUsers = await prisma.user.count();

    res.status(200).json({
      message: "KPIs des ventes récupérés avec succès !",
      data: {
        totalSales,
        totalRevenue,
        totalUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Une erreur est survenue lors de la récupération des KPIs des ventes.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const totalDevices = await prisma.device.count();
    const devicesByType = await prisma.device.groupBy({
      by: ["type"], // Grouper par type de dispositif
      _count: {
        type: true, // Compter le nombre de dispositifs par type
      },
    });

    const topProducts = devicesByType.map((device) => {
      const deviceCount = device._count.type; // Nombre de dispositifs pour ce type
      const devicePercentage = (deviceCount / totalDevices) * 100; // Pourcentage de dispositifs

      return {
        productName: device.type,
        deviceCount, 
        devicePercentage: devicePercentage.toFixed(2),
      };
    });
    topProducts.sort(
      (a, b) => parseFloat(b.devicePercentage) - parseFloat(a.devicePercentage)
    );
    res.status(200).json({
      success: true,
      message: "Top produits récupérés avec succès !",
      data: topProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération des top produits.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};
