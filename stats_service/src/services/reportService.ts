import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";
class ReportService {
  async generateZoneStats(startDate?: Date, endDate?: Date) {
    const dateFilter = this.createDateFilter(startDate, endDate);

    // Get total zones count
    const totalZones = await prisma.zone.count({
      where: dateFilter ? { createdAt: dateFilter } : {},
    });

    // Get zones by type
    const zonesByType = await prisma.zone.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
    });

    // Get zones created over time
    const zonesCreatedOverTime = await prisma.$queryRaw<
      { month: Date; count: number }[]
    >`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::integer as count
      FROM "Zone"
      ${
        dateFilter
          ? Prisma.sql`WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}`
          : Prisma.empty
      }
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
    // Get zones by environment
    const zonesByEnvironment = await prisma.zone.groupBy({
      by: ["envId"],
      _count: {
        id: true,
      },
    });

    const environmentDetails = await prisma.environment.findMany({
      where: {
        id: {
          in: zonesByEnvironment.map((z) => z.envId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const environmentMap: Record<number, string> = environmentDetails.reduce(
      (acc, env) => {
        acc[env.id] = env.name;
        return acc;
      },
      {} as Record<number, string>
    );

    return {
      totalZones,
      zonesByType: zonesByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      zonesCreatedOverTime,
      zonesByEnvironment: zonesByEnvironment.map((item) => ({
        environmentId: item.envId,
        environmentName:
          environmentMap[item.envId] || `Environment ${item.envId}`,
        count: item._count.id,
      })),
    };
  }

  // Generate system usage statistics
  async generateUsageStats(startDate?: Date, endDate?: Date) {
    const dateFilter = this.createDateFilter(startDate, endDate);

    // Get device usage data
    const deviceUsage = await prisma.userDeviceHistory.groupBy({
      by: ["deviceId"],
      _count: {
        id: true,
      },
      where: dateFilter ? { useDate: dateFilter } : {},
    });

    // Get unique users count
    const activeUsers = await prisma.userDeviceHistory.groupBy({
      by: ["userId"],
      _count: {
        id: true,
      },
      where: dateFilter ? { useDate: dateFilter } : {},
    });

    // Get device status distribution
    const deviceStatusDistribution = await prisma.device.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Get log activity
    const logActivity = await prisma.log.count({
      where: dateFilter ? { createdAt: dateFilter } : {},
    });

    // Get help requests
    const helpRequests = await prisma.helpRequest.count();

    return {
      deviceUsage: deviceUsage.map((item) => ({
        deviceId: item.deviceId,
        usageCount: item._count.id,
      })),
      activeUsersCount: activeUsers.length,
      activeUsersSummary: activeUsers.map((item) => ({
        userId: item.userId,
        activityCount: item._count.id,
      })),
      deviceStatusDistribution: deviceStatusDistribution.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      logActivity,
      helpRequests,
    };
  }

  // Generate sales statistics
  async generateSalesStats(startDate?: Date, endDate?: Date) {
    const dateFilter = this.createDateFilter(startDate, endDate);

    // Get total sales
    const totalSales = await prisma.sale.count({
      where: dateFilter ? { createdAt: dateFilter } : {},
    });

    // Get sales by device type
    const salesByDeviceType = await prisma.sale.findMany({
      where: dateFilter ? { createdAt: dateFilter } : {},
      include: {
        Device: {  // updated 
          select: {
            type: true,
            price: true,
          },
        },
      },
    });

    // Group sales by device type
    const deviceTypeSales: Record<string, { count: number; revenue: number }> =
      {};
    let totalRevenue = 0;

    salesByDeviceType.forEach((sale) => {
      const type = sale.Device.type;
      const price = sale.Device.price || 0;

      if (!deviceTypeSales[type]) {
        deviceTypeSales[type] = { count: 0, revenue: 0 };
      }

      deviceTypeSales[type].count++;
      deviceTypeSales[type].revenue += price;
      totalRevenue += price;
    });

    // Get monthly sales trend
    const monthlySalesTrend = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', s."createdAt") as month,
      COUNT(*)::integer as sales_count,
      COALESCE(SUM(d.price), 0)::integer as revenue
    FROM "Sale" s
    JOIN "Device" d ON s."deviceId" = d.id
    ${
      dateFilter
        ? Prisma.sql`WHERE s."createdAt" BETWEEN ${startDate} AND ${endDate}`
        : Prisma.empty
    }
    GROUP BY DATE_TRUNC('month', s."createdAt")
    ORDER BY month ASC
  `;

    return {
      totalSales,
      totalRevenue,
      deviceTypeSales: Object.entries(deviceTypeSales).map(([type, data]) => ({
        deviceType: type,
        salesCount: data.count,
        revenue: data.revenue,
      })),
      monthlySalesTrend,
    };
  }

  // Generate monthly active users statistics
  async generateMonthlyActiveUsersStats(
    months: number = 6,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const currentDate = endDate || new Date();
      const monthlyStats = [];
      let totalRegisteredUsers = 0;

      // Get total registered users
      totalRegisteredUsers = await prisma.user.count({
        where: startDate
          ? {
              createdAt: {
                gte: startDate,
              },
            }
          : {},
      });

      // Loop through the requested number of months
      for (let i = 0; i < months; i++) {
        // Calculate month start and end based on current date or provided end date
        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );

        // Skip months earlier than the startDate if provided
        if (startDate && monthStart < startDate) {
          continue;
        }

        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i + 1,
          0,
          23,
          59,
          59,
          999 // End of the month (last day, last millisecond)
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

        // Get details of active users for more comprehensive reporting
        const activeUsers = await prisma.user.findMany({
          where: {
            lastLogin: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          select: {
            id: true,
            email: true,
            lastLogin: true,
            Profile: {   // updated
              select: {
                firstname: true,
                lastname: true,
              },
            },
          },
        });

        // Get user activity data for this month
        const userActivity = await prisma.log.groupBy({
          by: ["userId"],
          _count: {
            id: true,
          },
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        // Map user activity counts to a more readable format
        const activityData = userActivity.map((entry) => ({
          userId: entry.userId,
          actionCount: entry._count.id,
        }));

        // Calculate percentage of active users
        const percentageActive =
          totalRegisteredUsers > 0
            ? (activeUsersCount / totalRegisteredUsers) * 100
            : 0;

        // Format month name for better readability in reports
        const monthName = new Intl.DateTimeFormat("en-US", {
          month: "long",
          year: "numeric",
        }).format(monthStart);

        // Add detailed statistics to our array
        monthlyStats.push({
          month: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`,
          monthName,
          activeUsers: activeUsersCount,
          percentageActive: parseFloat(percentageActive.toFixed(2)),
          period: {
            start: monthStart,
            end: monthEnd,
          },
          userDetails: activeUsers.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.Profile
              ? `${user.Profile.firstname || ""} ${
                  user.Profile.lastname || ""
                }`.trim()
              : "Unknown",
            lastLogin: user.lastLogin,
          })),
          activityDistribution: activityData,
        });
      }

      // Calculate trend (comparing most recent month to previous month)
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

      // Calculate average active users over the period
      const avgActiveUsers =
        monthlyStats.length > 0
          ? monthlyStats.reduce((sum, month) => sum + month.activeUsers, 0) /
            monthlyStats.length
          : 0;

      // Return comprehensive report data
      return {
        reportPeriod: {
          startDate:
            startDate ||
            new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - months + 1,
              1
            ),
          endDate: currentDate,
          totalMonths: monthlyStats.length,
        },
        currentMAU: monthlyStats[0]?.activeUsers || 0,
        totalRegisteredUsers,
        activationRate: monthlyStats[0]?.percentageActive || 0,
        trend: parseFloat(trend.toFixed(2)),
        averageActiveUsers: parseFloat(avgActiveUsers.toFixed(2)),
        monthlyData: monthlyStats,
      };
    } catch (error) {
      console.error("Error calculating monthly active users:", error);
      throw new Error("Failed to calculate monthly active users");
    }
  }

  // Helper method to create date filter
  private createDateFilter(startDate?: Date, endDate?: Date) {
    if (startDate && endDate) {
      return {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      return { gte: startDate };
    } else if (endDate) {
      return { lte: endDate };
    }

    return null;
  }

  // Export data to Excel format
  async exportToExcel(data: any, reportName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    // Function to flatten nested objects
    const flattenObject = (obj: any, prefix = "") => {
      return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix.length ? `${prefix}.` : "";
        const value = obj[k];
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          Object.assign(acc, flattenObject(value, pre + k));
        } else if (Array.isArray(value)) {
          // Check if the array contains objects
          if (
            value.every((item) => typeof item === "object" && item !== null)
          ) {
            // Convert each object into a comma-separated list and join with newlines
            acc[pre + k] = value
              .map((item: any) =>
                Object.entries(item)
                  .map(([ik, iv]) => `${ik}: ${iv}`)
                  .join(", ")
              )
              .join("\n");
          } else {
            // For arrays of primitives, join with commas
            acc[pre + k] = value.join(", ");
          }
        } else {
          acc[pre + k] = value;
        }
        return acc;
      }, {});
    };

    // Handle different data structures
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const firstItem = flattenObject(data[0]);
        const columns = Object.keys(firstItem).map((key) => ({
          header: key,
          key,
        }));
        worksheet.columns = columns;

        // Add all rows
        const rows = data.map((item) => flattenObject(item));
        worksheet.addRows(rows);
      }
    } else {
      const flatData = flattenObject(data);
      const rows = Object.entries(flatData).map(([key, value]) => ({
        key,
        value,
      }));

      worksheet.columns = [
        { header: "Metric", key: "key" },
        { header: "Value", key: "value" },
      ];

      worksheet.addRows(rows);
    }

    const filePath = path.join(os.tmpdir(), `${reportName}_${Date.now()}.xlsx`);

    // Use non-null assertion to ensure workbook.xlsx is defined
    await workbook.xlsx!.writeFile(filePath);

    return filePath;
  }

  // Export data to CSV format
  async exportToCSV(data: any, reportName: string): Promise<string> {
    let csvContent = "";

    // Function to flatten nested objects for CSV
    const flattenObject = (obj: any, prefix = "") => {
      return Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix.length ? `${prefix}_` : "";
        if (
          typeof obj[k] === "object" &&
          obj[k] !== null &&
          !Array.isArray(obj[k])
        ) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          // For arrays, we'll just convert to string
          acc[pre + k] = JSON.stringify(obj[k]);
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    try {
      if (Array.isArray(data)) {
        // For array data
        const flattenedData = data.map((item) => flattenObject(item));
        const parser = new Parser();
        csvContent = parser.parse(flattenedData);
      } else {
        // For object data
        const flatData = flattenObject(data);
        const rows = Object.entries(flatData).map(([key, value]) => ({
          metric: key,
          value,
        }));
        const parser = new Parser();
        csvContent = parser.parse(rows);
      }

      // Prepend BOM to ensure proper encoding in Excel
      csvContent = "\uFEFF" + csvContent;

      // Write to file
      const filePath = path.join(
        os.tmpdir(),
        `${reportName}_${Date.now()}.csv`
      );
      fs.writeFileSync(filePath, csvContent);
      return filePath;
    } catch (error) {
      console.error("Error generating CSV:", error);
      throw error;
    }
  }

  // Export data to PDF format
  async exportToPDF(data: any, reportName: string): Promise<string> {
    // Generate a temporary file path
    const filePath = path.join(os.tmpdir(), `${reportName}_${Date.now()}.pdf`);

    // Create PDF document with margin settings
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Helper function to format Date objects
    const formatDate = (date: Date): string => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
      }).format(date);
    };

    // Title and header section
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(`${reportName} Report`, { align: "center" });
    doc.moveDown();
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("gray")
      .text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
      });
    doc.moveDown(1);
    // Draw a horizontal line for separation
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("black")
      .stroke();
    doc.moveDown(2);

    // Recursive function to add content with improved formatting
    const addContentToPDF = (obj: any, depth = 0) => {
      // Use pixel indentation for clarity
      const indent = 20 * depth;

      Object.entries(obj).forEach(([key, value]) => {
        // If value is a Date, format it
        if (value instanceof Date) {
          value = formatDate(value);
        }

        if (value === null || value === undefined) {
          doc
            .font("Helvetica")
            .fontSize(12)
            .fillColor("black")
            .text(`${key}: N/A`, { indent });
          doc.moveDown(0.5);
        } else if (typeof value === "object" && !Array.isArray(value)) {
          doc
            .font("Helvetica-Bold")
            .fontSize(14 - depth)
            .fillColor("black")
            .text(`${key}:`, { indent });
          doc.moveDown(0.5);
          addContentToPDF(value, depth + 1);
          doc.moveDown(0.5);
        } else if (Array.isArray(value)) {
          doc
            .font("Helvetica-Bold")
            .fontSize(14 - depth)
            .fillColor("black")
            .text(`${key}:`, { indent });
          doc.moveDown(0.5);

          if (value.length === 0) {
            doc
              .font("Helvetica")
              .fontSize(12)
              .text(`No data`, { indent: indent + 20 });
          } else if (typeof value[0] === "object") {
            // Render table headers and rows
            const headers = Object.keys(value[0]);
            const startX = 50 + indent;
            let yPos = doc.y;

            // Calculate column width based on available width
            const availableWidth = doc.page.width - startX - 50;
            const colWidth = availableWidth / headers.length;

            // Render header row with bold font
            doc.font("Helvetica-Bold").fontSize(12);
            headers.forEach((header, i) => {
              doc.text(header, startX + i * colWidth, yPos, {
                width: colWidth,
                align: "left",
              });
            });
            yPos += 20;
            doc
              .moveTo(startX, yPos)
              .lineTo(startX + availableWidth, yPos)
              .stroke();

            // Render each data row
            doc.font("Helvetica").fontSize(12);
            value.forEach((row: any) => {
              yPos += 10; // Padding before each row
              headers.forEach((header, i) => {
                let cellValue = row[header];
                if (cellValue instanceof Date) {
                  cellValue = formatDate(cellValue);
                }
                if (cellValue === null || cellValue === undefined) {
                  cellValue = "N/A";
                }
                doc.text(cellValue.toString(), startX + i * colWidth, yPos, {
                  width: colWidth,
                  align: "left",
                });
              });
              yPos += 20;
              // Add a new page if near the bottom
              if (yPos > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
              }
            });
            doc.moveDown(1);
          } else {
            // For arrays of primitives, list each item
            value.forEach((item: any, index: number) => {
              doc
                .font("Helvetica")
                .fontSize(12)
                .text(`${index + 1}. ${item}`, { indent: indent + 20 });
            });
          }
          doc.moveDown(0.5);
        } else {
          doc
            .font("Helvetica")
            .fontSize(12)
            .fillColor("black")
            .text(`${key}: ${value}`, { indent });
          doc.moveDown(0.5);
        }
      });
    };

    // Process the data – if it’s an array, iterate each item
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(`Item ${index + 1}:`, { underline: true });
        doc.moveDown(0.5);
        addContentToPDF(item);
        doc.moveDown();
      });
    } else {
      addContentToPDF(data);
    }

    // Finalize the PDF file and close the stream
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  }
}

export default new ReportService();
