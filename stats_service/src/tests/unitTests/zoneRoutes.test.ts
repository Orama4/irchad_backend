import { describe, expect, it, afterAll } from "@jest/globals";
import request from "supertest";
import { app, server } from "../../index";


describe("Zone API Tests", () => {
    /**
     * Test GET /api/zones
     */
    it("should get all zones with pagination", async () => {
        const res = await request(app).get("/api/zones");
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("zones");
        expect(Array.isArray(res.body.zones)).toBe(true);
        expect(res.body).toHaveProperty("total");
        expect(res.body).toHaveProperty("totalPages");
        expect(res.body).toHaveProperty("currentPage");
        expect(typeof res.body.total).toBe("number");
        expect(typeof res.body.totalPages).toBe("number");
        expect(typeof res.body.currentPage).toBe("number");
    });

    /**
     * Test GET /api/zones with custom pagination
     */
    it("should get zones with custom pagination parameters", async () => {
        const page = 1;
        const pageSize = 2;
        const res = await request(app).get(`/api/zones?page=${page}&pageSize=${pageSize}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("zones");
        expect(Array.isArray(res.body.zones)).toBe(true);
        expect(res.body.zones.length).toBeLessThanOrEqual(pageSize);
        expect(res.body.currentPage).toBe(page);
    });

    /**
     * Test GET /api/zones/count
     */
    it("should get zone count", async () => {
        const res = await request(app).get("/api/zones/count");
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("total");
        expect(typeof res.body.total).toBe("number");
        expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test GET /api/zones/count-by-date
     */
    it("should get zone counts by month for a specific year", async () => {
        const year = 2025;
        const res = await request(app).get(`/api/zones/count-by-date?year=${year}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(12); // Should have data for all 12 months
        
        res.body.forEach((monthData: { month: number; total: number }) => {
            expect(monthData).toHaveProperty("month");
            expect(monthData).toHaveProperty("total");
            expect(typeof monthData.month).toBe("number");
            expect(typeof monthData.total).toBe("number");
            expect(monthData.month).toBeGreaterThanOrEqual(1);
            expect(monthData.month).toBeLessThanOrEqual(12);
            expect(monthData.total).toBeGreaterThanOrEqual(0);
        });
    });

    /**
     * Test GET /api/zones/count-by-date with invalid year
     */
    it("should return 400 when year parameter is invalid", async () => {
        const res = await request(app).get("/api/zones/count-by-date?year=invalid");
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toBe("Year must be a valid number");
    });

    /**
     * Test GET /api/zones/count-by-date with missing year
     */
    it("should return 400 when year parameter is missing", async () => {
        const res = await request(app).get("/api/zones/count-by-date");
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toBe("Year must be a valid number");
    });

    afterAll((done) => {
        server.close(done);
    });
});