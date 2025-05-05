import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import * as financialKpiService from "../services/financialKpiService";

/**
 * Get basic sales KPIs
 */
export const getSalesKPIs = async (
  req: Request,
  res: Response
): Promise<void> => {
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

/**
 * Get top selling products
 */
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

/**
 * Get revenue growth with Month-over-Month and Year-over-Year comparisons
 */
export const getRevenueGrowth = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    const revenueData = await financialKpiService.getRevenueGrowth(
      parsedStartDate,
      parsedEndDate
    );

    res.status(200).json({
      success: true,
      message:
        "Données de croissance du chiffre d'affaires récupérées avec succès",
      data: revenueData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du calcul de la croissance",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

/**
 * Get profit margin metrics
 */
export const getProfitMargins = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    const marginData = await financialKpiService.getProfitMargin(
      parsedStartDate,
      parsedEndDate
    );

    res.status(200).json({
      success: true,
      message: "Données de marge brute récupérées avec succès",
      data: marginData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du calcul des marges",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

/**
 * Get monthly active users analysis
 */
export const getActiveUserMetrics = async (req: Request, res: Response) => {
  try {
    const months = req.query.months
      ? parseInt(req.query.months as string)
      : undefined;

    const mauData = await financialKpiService.getMonthlyActiveUsers(months);

    res.status(200).json({
      success: true,
      message: "Données d'utilisateurs actifs mensuels récupérées avec succès",
      data: mauData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors du calcul des métriques d'utilisateurs actifs",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

/**
 * Get security incident metrics
 */
export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    const securityData = await financialKpiService.getSecurityIncidents(
      parsedStartDate,
      parsedEndDate
    );

    res.status(200).json({
      success: true,
      message: "Données d'incidents de sécurité récupérées avec succès",
      data: securityData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors du calcul des métriques de sécurité",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};

/**
 * Get end of period (month/quarter) projections
 */
export const getPeriodProjections = async (req: Request, res: Response) => {
  try {
    const period =
      (req.query.period as string)?.toLowerCase() === "quarter"
        ? "quarter"
        : "month";

    const projectionData = await financialKpiService.getPeriodProjections(
      period
    );

    res.status(200).json({
      success: true,
      message: `Projections de fin de ${
        period === "month" ? "mois" : "trimestre"
      } récupérées avec succès`,
      data: projectionData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors du calcul des projections",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
};
