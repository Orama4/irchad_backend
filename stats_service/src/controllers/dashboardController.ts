import { Request, Response } from 'express';
import { prisma } from '../lib/prisma'; 

export const getSalesKPIs = async (req: Request, res: Response) => {
    try {
        // Récupérer le nombre total de ventes
        const totalSales = await prisma.sale.count();

        // Récupérer toutes les ventes avec les dispositifs associés
        const salesWithDevices = await prisma.sale.findMany({
            include: {
                device: {
                    select: {
                        price: true, // Sélectionner le prix du dispositif
                    },
                },
            },
        });

        // Calculer le revenu total en additionnant les prix des dispositifs vendus
        const totalRevenue = salesWithDevices.reduce((sum, sale) => {
            return sum + (sale.device?.price || 0);
        }, 0);

        // Récupérer le nombre total d'utilisateurs
        const totalUsers = await prisma.user.count();

        // Réponse JSON
        res.status(200).json({
            success: true,
            message: "KPIs des ventes récupérés avec succès !",
            data: {
                totalSales,
                totalRevenue,
                totalUsers,
            },
        });
    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la récupération des KPIs des ventes.",
            error: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
};

export const getTopProducts = async (req: Request, res: Response) => {
    try {
        // Récupérer le nombre total de ventes
        const totalSales = await prisma.sale.count();

        // Récupérer le nombre de ventes par produit
        const salesByProduct = await prisma.device.findMany({
            include: {
                sales: true, // Inclure les ventes pour chaque produit
            },
        });

        // Calculer le pourcentage de ventes pour chaque produit
        const topProducts = salesByProduct.map((device) => {
            const productSales = device.sales.length; // Nombre de ventes pour ce produit
            const salesPercentage = (productSales / totalSales) * 100; // Pourcentage de ventes

            return {
                productName: device.type, // Nom du produit
                salesCount: productSales, // Nombre de ventes
                salesPercentage: salesPercentage.toFixed(2), // Pourcentage de ventes (arrondi à 2 décimales)
            };
        });

        // Trier les produits par pourcentage de ventes (du plus élevé au plus bas)
        topProducts.sort((a, b) => parseFloat(b.salesPercentage) - parseFloat(a.salesPercentage));

        // Réponse JSON
        res.status(200).json({
            success: true,
            message: "Top produits récupérés avec succès !",
            data: topProducts,
        });
    } catch (error) {
        // Gestion des erreurs
        res.status(500).json({
            success: false,
            message: "Une erreur est survenue lors de la récupération des top produits.",
            error: error instanceof Error ? error.message : "Erreur inconnue",
        });
    }
};