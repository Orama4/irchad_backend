import { describe, expect, it, afterAll } from "@jest/globals";
import request from "supertest";
import { app, server } from "..";
describe("Zone API Tests", () => {
    /**
     * Test GET /api/zones
     */
    beforeAll((done) => {
        let baseUrl: string;
        // Récupérer le port dynamiquement
        const address = server.address();
        if (address && typeof address !== "string") {
            baseUrl = `http://localhost:${address.port}`;
        }
        done();
    });
    it("should get all zones with pagination", async () => {
        const res = await request(app).get("/zones");
        
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
  /*  it("should get zones with custom pagination parameters", async () => {
        const page = 1;
        const pageSize = 2;
        const res = await request(app).get(`/zones?page=${page}`);
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("zones");
        expect(Array.isArray(res.body.zones)).toBe(true);
        expect(res.body.zones.length).toBeLessThanOrEqual(pageSize);
        expect(res.body.currentPage).toBe(page);
    });*/

    /**
    /**
     * Test GET /api/zones/count-by-date
     */
    it("should get zone counts by month for a specific year", async () => {
        const year = 2025;
        const res = await request(app).get(`/zones/kpi`);
    
        // Check the response status
        expect(res.status).toBe(200);
    
        // Check the response structure
        expect(typeof res.body).toBe("object");
        expect(res.body).toHaveProperty("totalZones");
        expect(res.body).toHaveProperty("progressZones");
    
        // Check that "progressZones" is an array
        expect(Array.isArray(res.body.progressZones)).toBe(true);
    
        // Check that "progressZones" has data for all 12 months
        expect(res.body.progressZones.length).toBe(12);
    
        // Check each month's data in the "progressZones" array
        res.body.progressZones.forEach((monthData: any) => {
            expect(monthData).toHaveProperty("name"); // Month name (e.g., "Jan")
            expect(monthData).toHaveProperty("value"); // Zone count (number)
            expect(typeof monthData.name).toBe("string"); // "name" should be a string
            expect(typeof monthData.value).toBe("number"); // "value" should be a number
            expect(monthData.value).toBeGreaterThanOrEqual(0); // Zone count should be >= 0
        });
    
        // Optionally, check the "totalZones" field
        expect(typeof res.body.totalZones).toBe("number");
        expect(res.body.totalZones).toBeGreaterThanOrEqual(0);
    });
    /**
     * Test GET /api/zones?search=empty
     */
    it("should handle an empty search query", async () => {
        const query = ""; // Empty query
        const res = await request(app).get(`/zones?search=${query}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.zones)).toBe(true);

        // Optionally, check that all zones are returned
        expect(res.body.zones.length).toBeGreaterThan(0); // Assuming the database has zones
    });


    /*afterAll((done) => {
        server.close(done);
    });*/
});