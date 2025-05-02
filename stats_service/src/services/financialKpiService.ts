import { prisma } from "../lib/prisma";

/**
 * Generates revenue statistics with Month-over-Month and Year-over-Year growth
 * @param startDate Optional start date for reporting period
 * @param endDate Optional end date for reporting period
 * @returns Revenue statistics with growth metrics
 */
export const getRevenueGrowth = async (startDate?: Date, endDate?: Date) => {
  try {
    // Use provided dates or defaults
    const reportEndDate = endDate || new Date();

    // Calculate start of current month and previous month
    const currentMonthStart = new Date(
      reportEndDate.getFullYear(),
      reportEndDate.getMonth(),
      1
    );
    const previousMonthStart = new Date(
      reportEndDate.getFullYear(),
      reportEndDate.getMonth() - 1,
      1
    );
    const previousYearSameMonthStart = new Date(
      reportEndDate.getFullYear() - 1,
      reportEndDate.getMonth(),
      1
    );

    // Query sales within these periods
    const currentMonthSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: reportEndDate,
        },
      },
      include: {
        Device: {
          select: {
            price: true,
          },
        },
      },
    });

    const previousMonthSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
      include: {
        Device: {
          select: {
            price: true,
          },
        },
      },
    });

    const previousYearSameMonthSales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: previousYearSameMonthStart,
          lt: new Date(
            previousYearSameMonthStart.getFullYear(),
            previousYearSameMonthStart.getMonth() + 1,
            0
          ),
        },
      },
      include: {
        Device: {
          select: {
            price: true,
          },
        },
      },
    });

    // Calculate revenue for each period
    const currentMonthRevenue = currentMonthSales.reduce(
      (sum, sale) => sum + (sale.Device?.price || 0),
      0
    );

    const previousMonthRevenue = previousMonthSales.reduce(
      (sum, sale) => sum + (sale.Device?.price || 0),
      0
    );

    const previousYearSameMonthRevenue = previousYearSameMonthSales.reduce(
      (sum, sale) => sum + (sale.Device?.price || 0),
      0
    );

    // Calculate growth percentages
    const momGrowth =
      previousMonthRevenue === 0
        ? 100 // If previous month was 0, consider it 100% growth
        : ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100;

    const yoyGrowth =
      previousYearSameMonthRevenue === 0
        ? 100 // If previous year same month was 0, consider it 100% growth
        : ((currentMonthRevenue - previousYearSameMonthRevenue) /
            previousYearSameMonthRevenue) *
          100;

    // Return formatted data
    return {
      currentPeriod: {
        startDate: currentMonthStart,
        endDate: reportEndDate,
        revenue: currentMonthRevenue,
      },
      previousPeriod: {
        startDate: previousMonthStart,
        endDate: new Date(currentMonthStart.getTime() - 1),
        revenue: previousMonthRevenue,
      },
      previousYearSamePeriod: {
        startDate: previousYearSameMonthStart,
        endDate: new Date(
          previousYearSameMonthStart.getFullYear(),
          previousYearSameMonthStart.getMonth() + 1,
          0
        ),
        revenue: previousYearSameMonthRevenue,
      },
      growth: {
        monthOverMonth: parseFloat(momGrowth.toFixed(2)),
        yearOverYear: parseFloat(yoyGrowth.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("Error calculating revenue growth:", error);
    throw new Error("Failed to calculate revenue growth");
  }
};

/**
 * Calculates profit margin metrics including gross margin percentage
 * @param startDate Optional start date for reporting period
 * @param endDate Optional end date for reporting period
 * @returns Profit margin statistics
 */
export const getProfitMargin = async (startDate?: Date, endDate?: Date) => {
  try {
    // Use provided dates or defaults
    const reportStartDate =
      startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const reportEndDate = endDate || new Date();

    // Get all sales for the period with their devices
    const salesWithDevices = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: reportStartDate,
          lte: reportEndDate,
        },
      },
      include: {
        Device: {
          select: {
            price: true,
            manufacturingCost: true, // Assuming this field exists; if not, you may need schema modifications
          },
        },
      },
    });

    // Calculate revenue and costs
    let totalRevenue = 0;
    let totalCost = 0;
    let itemsWithCostData = 0;

    salesWithDevices.forEach((sale) => {
      totalRevenue += sale.Device?.price || 0;

      // Check if we have manufacturing cost data
      if (sale.Device?.manufacturingCost) {
        totalCost += sale.Device.manufacturingCost;
        itemsWithCostData++;
      } else if (sale.Device?.price) {
        // If no manufacturing cost is available, estimate as 60% of price
        // This is a business assumption and should be adjusted based on your actual data
        const estimatedCost = sale.Device.price * 0.6;
        totalCost += estimatedCost;
        itemsWithCostData++;
      }
    });

    // Calculate gross profit
    const grossProfit = totalRevenue - totalCost;

    // Calculate margins
    const grossMarginPercentage =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate average selling price and cost if we have items
    const averageSellingPrice =
      salesWithDevices.length > 0 ? totalRevenue / salesWithDevices.length : 0;

    const averageCost =
      itemsWithCostData > 0 ? totalCost / itemsWithCostData : 0;

    // Return formatted data
    return {
      period: {
        startDate: reportStartDate,
        endDate: reportEndDate,
      },
      totalRevenue,
      totalCost,
      grossProfit,
      grossMarginPercentage: parseFloat(grossMarginPercentage.toFixed(2)),
      averageSellingPrice: parseFloat(averageSellingPrice.toFixed(2)),
      averageCost: parseFloat(averageCost.toFixed(2)),
      saleCount: salesWithDevices.length,
    };
  } catch (error) {
    console.error("Error calculating profit margins:", error);
    throw new Error("Failed to calculate profit margins");
  }
};

/**
 * Calculates monthly active user metrics with trend analysis
 * @param months Number of months to look back
 * @returns Monthly active user statistics
 */
export const getMonthlyActiveUsers = async (months: number = 6) => {
  try {
    const currentDate = new Date();
    const monthlyStats = [];
    let totalRegisteredUsers = 0;

    // Get total registered users
    totalRegisteredUsers = await prisma.user.count();

    // Loop through the requested number of months
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthEnd = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i + 1,
        0
      );

      // Count active users (users who logged in during this month)
      const activeUsersCount = await prisma.user.count({
        where: {
          lastLogin: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      // Calculate percentage of active users
      const percentageActive =
        totalRegisteredUsers > 0
          ? (activeUsersCount / totalRegisteredUsers) * 100
          : 0;

      // Add to our stats array
      monthlyStats.push({
        month: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
        activeUsers: activeUsersCount,
        percentageActive: parseFloat(percentageActive.toFixed(2)),
        period: {
          start: monthStart,
          end: monthEnd,
        },
      });
    }

    // Calculate trend - handle the case where previous month has 0 active users
    let trend = 0;
    if (monthlyStats.length >= 2) {
      if (monthlyStats[1].activeUsers === 0) {
        // If previous month had 0 users and current month has users, show 100% growth
        trend = monthlyStats[0].activeUsers > 0 ? 100 : 0;
      } else {
        // Normal calculation when previous month had active users
        trend =
          ((monthlyStats[0].activeUsers - monthlyStats[1].activeUsers) /
            monthlyStats[1].activeUsers) *
          100;
      }
    }

    return {
      currentMAU: monthlyStats[0]?.activeUsers || 0,
      totalRegisteredUsers,
      activationRate: monthlyStats[0]?.percentageActive || 0,
      trend: parseFloat(trend.toFixed(2)),
      monthlyData: monthlyStats,
    };
  } catch (error) {
    console.error("Error calculating monthly active users:", error);
    throw new Error("Failed to calculate monthly active users");
  }
};

/**
 * Tracks security incidents with calculation of incidents per user
 * @param startDate Optional start date for reporting period
 * @param endDate Optional end date for reporting period
 * @returns Security incident statistics
 */
export const getSecurityIncidents = async (
  startDate?: Date,
  endDate?: Date
) => {
  try {
    // Use provided dates or defaults
    const reportStartDate =
      startDate ||
      new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1);
    const reportEndDate = endDate || new Date();

    // Get security incidents for the period
    // Assuming a securityIncident model exists - if not, needs to be added to schema
    const incidents = await prisma.securityIncident.findMany({
      where: {
        reportedAt: {
          gte: reportStartDate,
          lte: reportEndDate,
        },
      },
      orderBy: {
        reportedAt: "asc",
      },
    });

    // Get active users during this period for calculation of incidents per user
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: reportStartDate,
          lte: reportEndDate,
        },
      },
    });

    // Group incidents by severity
    const severityCounts = incidents.reduce(
      (acc: Record<string, number>, incident) => {
        const severity = incident.severity || "unknown";
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {}
    );

    // Group incidents by month for trend analysis
    const monthlyIncidents: Record<string, number> = {};
    incidents.forEach((incident) => {
      const month = `${incident.reportedAt.getFullYear()}-${
        incident.reportedAt.getMonth() + 1
      }`;
      monthlyIncidents[month] = (monthlyIncidents[month] || 0) + 1;
    });

    // Convert to array and sort chronologically
    const monthlyTrend = Object.entries(monthlyIncidents)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aYear, aMonth] = a.month.split("-").map((n) => parseInt(n));
        const [bYear, bMonth] = b.month.split("-").map((n) => parseInt(n));
        return aYear - bYear || aMonth - bMonth;
      });

    // Calculate incidents per active user
    const incidentsPerUser =
      activeUsers > 0 ? incidents.length / activeUsers : 0;

    return {
      period: {
        startDate: reportStartDate,
        endDate: reportEndDate,
      },
      totalIncidents: incidents.length,
      incidentsPerActiveUser: parseFloat(incidentsPerUser.toFixed(4)),
      severityBreakdown: severityCounts,
      monthlyTrend,
      activeUsers,
    };
  } catch (error) {
    console.error("Error calculating security incidents:", error);
    throw new Error("Failed to calculate security incidents");
  }
};

/**
 * Generates end-of-period projections for revenue and profit
 * @param period 'month' or 'quarter'
 * @returns Projected figures for current period
 */
export const getPeriodProjections = async (period: "month" | "quarter") => {
  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();

    let periodStartDate, periodEndDate, daysInPeriod, daysElapsed;

    if (period === "month") {
      // Monthly projection
      periodStartDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      periodEndDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      daysInPeriod = periodEndDate.getDate();
      daysElapsed = Math.min(currentDay, daysInPeriod);
    } else {
      // Quarterly projection
      const currentQuarter = Math.floor(currentDate.getMonth() / 3);
      periodStartDate = new Date(
        currentDate.getFullYear(),
        currentQuarter * 3,
        1
      );
      periodEndDate = new Date(
        currentDate.getFullYear(),
        (currentQuarter + 1) * 3,
        0
      );

      // Calculate days in quarter
      const quarterMonths = [
        new Date(
          periodStartDate.getFullYear(),
          periodStartDate.getMonth(),
          0
        ).getDate(),
        new Date(
          periodStartDate.getFullYear(),
          periodStartDate.getMonth() + 1,
          0
        ).getDate(),
        new Date(
          periodStartDate.getFullYear(),
          periodStartDate.getMonth() + 2,
          0
        ).getDate(),
      ];
      daysInPeriod = quarterMonths.reduce((sum, days) => sum + days, 0);

      // Calculate days elapsed in quarter
      const monthsElapsed = currentDate.getMonth() - periodStartDate.getMonth();
      const previousMonthsDays =
        monthsElapsed > 0
          ? quarterMonths
              .slice(0, monthsElapsed)
              .reduce((sum, days) => sum + days, 0)
          : 0;
      daysElapsed = previousMonthsDays + currentDay;
    }

    // Get revenue data for elapsed period
    const salesData = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: periodStartDate,
          lte: currentDate,
        },
      },
      include: {
        Device: {
          select: {
            price: true,
            manufacturingCost: true, // Assuming this field exists
          },
        },
      },
    });

    // Calculate current metrics
    const currentRevenue = salesData.reduce(
      (sum, sale) => sum + (sale.Device?.price || 0),
      0
    );

    // Calculate costs
    const currentCosts = salesData.reduce((sum, sale) => {
      if (sale.Device?.manufacturingCost) {
        return sum + sale.Device.manufacturingCost;
      } else if (sale.Device?.price) {
        // Fallback estimation
        return sum + sale.Device.price * 0.6;
      }
      return sum;
    }, 0);

    const currentProfit = currentRevenue - currentCosts;

    // Calculate daily averages
    const dailyAvgRevenue = daysElapsed > 0 ? currentRevenue / daysElapsed : 0;
    const dailyAvgProfit = daysElapsed > 0 ? currentProfit / daysElapsed : 0;

    // Project for full period
    const projectedRevenue = dailyAvgRevenue * daysInPeriod;
    const projectedProfit = dailyAvgProfit * daysInPeriod;

    // Calculate percentage of projection already achieved
    const percentCompleted = (daysElapsed / daysInPeriod) * 100;
    const revenueProgress =
      projectedRevenue > 0 ? (currentRevenue / projectedRevenue) * 100 : 0;
    const profitProgress =
      projectedProfit > 0 ? (currentProfit / projectedProfit) * 100 : 0;

    return {
      period: {
        type: period,
        startDate: periodStartDate,
        endDate: periodEndDate,
        daysInPeriod,
        daysElapsed,
        percentCompleted: parseFloat(percentCompleted.toFixed(2)),
      },
      current: {
        revenue: parseFloat(currentRevenue.toFixed(2)),
        profit: parseFloat(currentProfit.toFixed(2)),
        revenueProgress: parseFloat(revenueProgress.toFixed(2)),
        profitProgress: parseFloat(profitProgress.toFixed(2)),
      },
      projected: {
        revenue: parseFloat(projectedRevenue.toFixed(2)),
        profit: parseFloat(projectedProfit.toFixed(2)),
      },
    };
  } catch (error) {
    console.error(`Error calculating ${period} projections:`, error);
    throw new Error(`Failed to calculate ${period} projections`);
  }
};
