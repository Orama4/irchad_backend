import request from "supertest";
import { app, server } from "..";
import { describe, it, expect } from "@jest/globals";

import prisma from "../lib/prisma"




describe("GET /sales/total-sales", () => {
    
    beforeAll((done) => {
        let baseUrl: string;
        // Récupérer le port dynamiquement
        const address = server.address();
        if (address && typeof address !== "string") {
            baseUrl = `http://localhost:${address.port}`;
        }
        done();
    });
    it("Devrait retourner le nombre total des vents", async () => {
        const response = await request(app).get("/sales/total-sales");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("totalSales");
        expect(typeof response.body.totalSales).toBe("number");    });
});


describe("GET /sales/total-revenue", () => {
    it("Devrait retourner le revenue total ", async () => {
        const response = await request(app).get("/sales/total-revenue");
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("totalRevenue");
        expect(typeof response.body.totalRevenue).toBe("number");    });
});


/*

describe("POST /sales/progress-stats", () => {
    it("Devrait retourner les statistiques des ventes", async () => {
        const response = await request(app)
            .post("/sales/progress-stats")
            .send({ "startDate": "2024-01-01", "groupBy": "month" });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        if (response.body.length > 0) {
            expect(response.body[0]).toHaveProperty("period");
            expect(response.body[0]).toHaveProperty("totalSales");
            expect(typeof response.body[0].period).toBe("string");
            expect(typeof response.body[0].totalSales).toBe("number");
        }
    });

    it("Devrait retourner une erreur si startDate est manquant", async () => {
        const response = await request(app)
            .get("/sales/progress-stats")
            .send({ groupBy: "month" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "La date de début est requise.");
    });

    it("Devrait retourner une erreur si groupBy est invalide", async () => {
        const response = await request(app)
            .get("/sales/progress-stats")
            .send({ startDate: "2024-01-01", groupBy: "invalid" });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("error", "Le groupBy doit être 'day', 'month' ou 'year'.");
    });
});


*/

describe("GET /sales", () => {
    it("Devrait retourner une liste de ventes paginée", async () => {
        const response = await request(app)
            .get("/sales?page=1&pageSize=10&filter=all")
            .expect(200);

        expect(response.body).toHaveProperty("sales");
        expect(response.body).toHaveProperty("total");
        expect(response.body).toHaveProperty("totalPages");
        expect(response.body).toHaveProperty("currentPage");
        expect(Array.isArray(response.body.sales)).toBe(true);

        if (response.body.sales.length > 0) {
            expect(response.body.sales[0]).toHaveProperty("id");
            expect(response.body.sales[0]).toHaveProperty("createdAt");
            expect(response.body.sales[0].device).toHaveProperty("type");
            expect(response.body.sales[0].buyer.user.profile).toHaveProperty("lastname");
            expect(response.body.sales[0].buyer.user.profile).toHaveProperty("firstname");
        }
    });

     afterAll((done) => {
            server.close(done);
        });
});
