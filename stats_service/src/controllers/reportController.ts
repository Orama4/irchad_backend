//reportController.ts file is used to handle the report generation requests. It uses the reportService to generate the reports and exports them in the requested format.
import { Request, Response } from "express";
import reportService from "../services/reportService";
import { $Enums } from "@prisma/client";
import * as fs from "fs";

export const generateUsageReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Generate report data
    const reportData = await reportService.generateUsageStats(
      parsedStartDate,
      parsedEndDate
    );

    // Return JSON if no format specified
    if (!format) {
      res.json({ success: true, data: reportData });
      return;
    }

    // Otherwise export in requested format
    await exportReport(
      reportData,
      "System_Usage_Report",
      format as string,
      res
    );
  } catch (error) {
    console.error("Error generating usage report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error,
    });
  }
};

export const generateSalesReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Generate report data
    const reportData = await reportService.generateSalesStats(
      parsedStartDate,
      parsedEndDate
    );

    // Return JSON if no format specified
    if (!format) {
      res.json({ success: true, data: reportData });
      return;
    }

    // Otherwise export in requested format
    await exportReport(reportData, "Sales_Report", format as string, res);
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error,
    });
  }
};

// Helper function to handle report exports
const exportReport = async (
  data: any,
  reportName: string,
  format: string,
  res: Response
): Promise<void> => {
  try {
    let filePath: string;
    let contentType: string;

    // Export based on requested format
    switch (format.toLowerCase()) {
      case "excel":
      case "xlsx":
        filePath = await reportService.exportToExcel(data, reportName);
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;

      case "csv":
        filePath = await reportService.exportToCSV(data, reportName);
        contentType = "text/csv";
        break;

      case "pdf":
        filePath = await reportService.exportToPDF(data, reportName);
        contentType = "application/pdf";
        break;

      default:
        res.status(400).json({
          success: false,
          message:
            "Unsupported export format. Supported formats: excel, csv, pdf",
        });
        return;
    }

    // Set headers for file download
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportName}_${
        new Date().toISOString().split("T")[0]
      }.${format.toLowerCase()}`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up the file after sending
    fileStream.on("end", () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error(`Error exporting to ${format}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to export as ${format}`,
      error: error,
    });
  }
};

export const generateZoneReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

    // Generate report data
    const reportData = await reportService.generateZoneStats(
      parsedStartDate,
      parsedEndDate
    );

    // Return JSON if no format specified
    if (!format) {
      res.json({ success: true, data: reportData });
      return;
    }

    // Otherwise export in requested format
    await exportReport(reportData, "Zones_Report", format as string, res);
  } catch (error) {
    console.error("Error generating zones report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error,
    });
  }
};

export const generateMonthlyActiveUsersReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format, months } = req.query;

    // Parse dates if provided
    const parsedStartDate = startDate
      ? new Date(startDate as string)
      : undefined;
    const parsedEndDate = endDate ? new Date(endDate as string) : undefined;
    
    // Parse number of months to look back
    const parsedMonths = months ? parseInt(months as string) : 6; // Default to 6 months

    // Generate report data
    const reportData = await reportService.generateMonthlyActiveUsersStats(
      parsedMonths,
      parsedStartDate,
      parsedEndDate
    );

    // Return JSON if no format specified
    if (!format) {
      res.json({ success: true, data: reportData });
      return;
    }

    // Otherwise export in requested format
    await exportReport(
      reportData, 
      "Monthly_Active_Users_Report", 
      format as string, 
      res
    );
  } catch (error) {
    console.error("Error generating monthly active users report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
