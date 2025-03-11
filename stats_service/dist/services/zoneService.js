"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZoneCountByDate = exports.getZonesCount = exports.getZones = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getZones = async (page = 1, pageSize = 10) => {
    const skip = (page - 1) * pageSize;
    const zones = await prisma.zone.findMany({
        skip: skip,
        take: pageSize,
    });
    const total = await prisma.zone.count();
    return { zones, total };
};
exports.getZones = getZones;
const getZonesCount = async () => {
    const total = await prisma.zone.count();
    return { total };
};
exports.getZonesCount = getZonesCount;
const getZoneCountByDate = async (year) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const zones = await prisma.zone.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lt: endDate,
            },
        },
        select: {
            createdAt: true,
        },
    });
    const result = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        total: 0,
    }));
    zones.forEach((zone) => {
        const month = new Date(zone.createdAt).getMonth();
        result[month].total += 1;
    });
    return result;
};
exports.getZoneCountByDate = getZoneCountByDate;
