import { describe, expect, it,afterAll } from "@jest/globals";
import request from "supertest";
import { app ,server} from "..";
import { Device} from "@prisma/client"; 

describe("Device API Tests", () => {


    beforeAll((done) => {
        let baseUrl: string;
        // Récupérer le port dynamiquement
        const address = server.address();
        if (address && typeof address !== "string") {
            baseUrl = `http://localhost:${address.port}`;
        }
        done();
    });

    /**
     * Test GET /api/devices
     */
    it("should get all devices", async () => {
        const res = await request(app).get("/devices");
        
        expect(res.status).toBe(200); 
        expect(Array.isArray(res.body.devices)).toBe(true); 
        expect(res.body.devices.length).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test GET /api/devices/stats
     */

    it("should get device statistics with count and percentage", async () => {
        const res = await request(app).get("/devices/stats");

        expect(res.status).toBe(200); 
        
        expect(res.body).toHaveProperty("total");

        const fields = ["maintenance", "en panne", "déconnecté", "connecté"];
        
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
        const res = await request(app).get("/devices/monthly-stats");
            
        expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true); // Response should be an array
    expect(res.body.length).toBe(12); // There should be 12 months

    // Check the structure of each month's data
    res.body.forEach((monthData:any) => {
        expect(monthData).toHaveProperty("name"); // Month abbreviation (e.g., "Jan")
        expect(monthData).toHaveProperty("value"); // Sales count (number)
        expect(typeof monthData.name).toBe("string"); // "name" should be a string
        expect(typeof monthData.value).toBe("number"); // "value" should be a number
        expect(monthData.value).toBeGreaterThanOrEqual(0); // Sales count should be >= 0
    });

    // Optionally, check if the months are in the correct order
    const expectedMonths = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    res.body.forEach((monthData:any, index:number) => {
        expect(monthData.name).toBe(expectedMonths[index]); // Months should be in order
    });
    });

    it("should return devices filtered by type", async () => {
        const res = await request(app).get("/devices").query({ query: "Ceinture" });
    
        // Check the response status
        expect(res.status).toBe(200);
    
        // Check the response structure
        expect(typeof res.body).toBe("object");
        expect(res.body).toHaveProperty("devices");
        expect(res.body).toHaveProperty("totalPages");
        expect(res.body).toHaveProperty("currentPage");
    
        // Check that "devices" is an array
        expect(Array.isArray(res.body.devices)).toBe(true);
    
        // Check each device in the "devices" array
        res.body.devices.forEach((device: any) => {
            console.log("Checking device:", device);
            expect(device.type).toBe("Ceinture"); // Ensure the type is "Ceinture"
        });
    
        // Optionally, check pagination fields
        expect(typeof res.body.totalPages).toBe("number");
        expect(typeof res.body.currentPage).toBe("number");
        expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
        expect(res.body.currentPage).toBeGreaterThanOrEqual(1);
    });

   /* it("should return devices filtered by status", async () => {
        const res = await request(app).get("/api/devices/search").query({ type: "connected" });
        expect(res.status).toBe(200); 

        expect(Array.isArray(res.body)).toBe(true);

        res.body.forEach((device: Device) => {
            console.log("Checking device:", device);
            expect(device.type).toBe("connected");
        });
    });*/



    afterAll((done) => {
        server.close(done);
    });

});
