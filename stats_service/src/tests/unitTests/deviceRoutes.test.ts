import { describe, expect, it,afterAll } from "@jest/globals";
import request from "supertest";
import {app,server} from "../../index"; 
import { Device } from "@prisma/client"; 

describe("Device API Tests", () => {
    /**
     * Test GET /api/devices
     */
    it("should get all devices", async () => {
        const res = await request(app).get("/api/devices");
        
        expect(res.status).toBe(200); 
        expect(Array.isArray(res.body)).toBe(true); 
        expect(res.body.length).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test GET /api/devices/stats
     */

    it("should get device statistics with count and percentage", async () => {
        const res = await request(app).get("/api/devices/stats");

        expect(res.status).toBe(200); 
        
        expect(res.body).toHaveProperty("total");

        const fields = ["maintenance", "enpanne", "connected", "disconnected"];
        
        fields.forEach(field => {
            expect(res.body).toHaveProperty(field);
            expect(res.body[field]).toHaveProperty("count");
            expect(res.body[field]).toHaveProperty("percentage");

            // Ensure count is a number
            expect(typeof res.body[field].count).toBe("number");

            //Ensure percentage is a number between 0 and 100
            expect(typeof res.body[field].percentage).toBe("number");
            expect(res.body[field].percentage).toBeGreaterThanOrEqual(0);
            expect(res.body[field].percentage).toBeLessThanOrEqual(100);
        });
    });

    it("should return devices count per month", async () => {
        const res = await request(app).get("/api/devices/monthly-stats");
            
        expect(res.status).toBe(200);
        expect(typeof res.body).toBe("object");
        expect(Object.keys(res.body).length).toBeGreaterThanOrEqual(0); 
            
        // Check if all months (1-12) return numbers
        Object.values(res.body).forEach((count) => {
            expect(typeof count).toBe("number");
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    it("should return devices filtered by type", async () => {
        const res = await request(app).get("/api/devices/search").query({ type: "Ceinture" });
        expect(res.status).toBe(200); 

        expect(Array.isArray(res.body)).toBe(true);

        res.body.forEach((device: Device) => {
            console.log("Checking device:", device);
            expect(device.type).toBe("Ceinture");
        });
    });


    it("should return devices filtered by status", async () => {
        const res = await request(app).get("/api/devices/search").query({ type: "connected" });
        expect(res.status).toBe(200); 

        expect(Array.isArray(res.body)).toBe(true);

        res.body.forEach((device: Device) => {
            console.log("Checking device:", device);
            expect(device.type).toBe("connected");
        });
    });



    afterAll((done) => {
        server.close(done);
    });

});
