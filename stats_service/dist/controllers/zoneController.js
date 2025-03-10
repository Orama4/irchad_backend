"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalZones = exports.getAllZones = void 0;
const zoneService_1 = require("../services/zoneService");
const getAllZones = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const { zones, total } = await (0, zoneService_1.getZones)(page, pageSize);
        res.status(200).json({
            zones,
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: page,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllZones = getAllZones;
const getTotalZones = async (req, res) => {
    try {
        const { total } = await (0, zoneService_1.getZonesCount)();
        res.status(200).json({ total });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTotalZones = getTotalZones;
