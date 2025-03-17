import { prisma } from "../lib/prisma";
import ExcelJS from "exceljs";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";
class ReportService {
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
        device: {
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
      const type = sale.device.type;
      const price = sale.device.price || 0;

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
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as sales_count,
        SUM(d.price) as revenue
      FROM "Sale" s
      JOIN "Device" d ON s."deviceId" = d.id
      ${
        dateFilter
          ? `WHERE s."createdAt" >= ${startDate} AND s."createdAt" <= ${endDate}`
          : ""
      }
      GROUP BY DATE_TRUNC('month', "createdAt")
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
        if (
          typeof obj[k] === "object" &&
          obj[k] !== null &&
          !Array.isArray(obj[k])
        ) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
          // For arrays, we'll just convert to string to keep it simple
          acc[pre + k] = JSON.stringify(obj[k]);
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {});
    };

    // Handle different data structures
    if (Array.isArray(data)) {
      // If it's an array, use the first item to extract columns
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
      // If it's an object, create separate sections
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

    // Generate a temporary file path
    const filePath = path.join(os.tmpdir(), `${reportName}_${Date.now()}.xlsx`);

    // Write to file
    await workbook.xlsx.writeFile(filePath);

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

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(20).text(`${reportName} Report`, { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Generated on: ${new Date().toLocaleString()}`, {
        align: "center",
      });
    doc.moveDown(2);

    // Function to recursively add content to PDF
    const addContentToPDF = (obj: any, depth = 0) => {
      const indent = "  ".repeat(depth);

      Object.entries(obj).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          doc.text(`${indent}${key}: N/A`);
        } else if (typeof value === "object" && !Array.isArray(value)) {
          doc.fontSize(14 - depth).text(`${indent}${key}:`);
          doc.moveDown(0.5);
          addContentToPDF(value, depth + 1);
          doc.moveDown(0.5);
        } else if (Array.isArray(value)) {
          doc.fontSize(14 - depth).text(`${indent}${key}:`);
          doc.moveDown(0.5);

          if (value.length === 0) {
            doc.text(`${indent}  No data`);
          } else if (typeof value[0] === "object") {
            // Table header
            const headers = Object.keys(value[0]);
            let yPos = doc.y;
            let maxY = yPos;

            // Check if we need a new page for the table
            const estimatedHeight = (value.length + 1) * 20; // rough estimate
            if (doc.y + estimatedHeight > doc.page.height - 100) {
              doc.addPage();
              yPos = doc.y;
              maxY = yPos;
            }

            // Simple table rendering
            const startX = 50 + depth * 10;
            const colWidth =
              (doc.page.width - 100 - depth * 20) / headers.length;

            // Draw header
            headers.forEach((header, i) => {
              doc.text(header, startX + i * colWidth, yPos, {
                width: colWidth,
                align: "left",
              });
            });

            yPos += 20;
            doc
              .moveTo(startX, yPos)
              .lineTo(startX + colWidth * headers.length, yPos)
              .stroke();
            yPos += 5;

            // Draw rows
            value.forEach((row: any) => {
              headers.forEach((header, i) => {
                const cellValue =
                  row[header] !== null && row[header] !== undefined
                    ? row[header].toString()
                    : "N/A";
                doc.text(cellValue, startX + i * colWidth, yPos, {
                  width: colWidth,
                  align: "left",
                });
              });
              yPos += 20;

              if (yPos > maxY) maxY = yPos;

              // Check if we need a new page
              if (yPos > doc.page.height - 50) {
                doc.addPage();
                yPos = 50;
                maxY = yPos;
              }
            });

            doc.y = maxY + 10;
          } else {
            // Simple array
            value.forEach((item: any, index: number) => {
              doc.text(`${indent}  ${index + 1}. ${item}`);
            });
          }
          doc.moveDown(0.5);
        } else {
          doc.text(`${indent}${key}: ${value}`);
        }
      });
    };

    // Add content based on data type
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        doc.fontSize(16).text(`Item ${index + 1}:`);
        doc.moveDown(0.5);
        addContentToPDF(item);
        doc.moveDown();
      });
    } else {
      addContentToPDF(data);
    }

    // Finalize PDF and close the stream
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    });
  }
}

export default new ReportService();