// report.test.ts
jest.setTimeout(30000); // sets timeout to 30 seconds
import { describe, expect, it, afterAll, beforeAll } from "@jest/globals";
import request from "supertest";
import { app, server } from "..";

describe("Report API Tests", () => {
  let baseUrl: string;

  beforeAll((done) => {
    const address = server.address();
    if (address && typeof address !== "string") {
      baseUrl = `http://localhost:${address.port}`;
    }
    done();
  });

  /**
   * Test GET /reports/usage endpoint
   */
  describe("GET /reports/usage", () => {
    it("should return usage report JSON when no format is specified", async () => {
      const res = await request(app).get("/reports/usage");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should return an Excel file when format=excel is provided", async () => {
      const res = await request(app).get("/reports/usage?format=excel");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
    });
  });

  /**
   * Test GET /reports/sales endpoint
   */
  describe("GET /reports/sales", () => {
    it("should return sales report JSON when no format is specified", async () => {
      const res = await request(app).get("/reports/sales");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should return a CSV file when format=csv is provided", async () => {
      const res = await request(app).get("/reports/sales?format=csv");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("text/csv");
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
    });
  });

  /**
   * Test GET /reports/zones endpoint
   */
  describe("GET /reports/zones", () => {
    it("should return zones report JSON when no format is specified", async () => {
      const res = await request(app).get("/reports/zones");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should return a PDF file when format=pdf is provided", async () => {
      const res = await request(app).get("/reports/zones?format=pdf");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toBe("application/pdf");
      expect(res.headers["content-disposition"]).toMatch(/attachment/);
    });
  });

  afterAll((done) => {
    server.close(done);
  });
});
