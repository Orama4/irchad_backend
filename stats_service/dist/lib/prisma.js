"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Set the transaction timeout
process.env.PRISMA_CLIENT_TRANSACTION_MAX_TIMEOUT = "10000";
// Use the cached instance in development, or create a new one in production
exports.prisma = global.prisma ?? new client_1.PrismaClient();
if (process.env.NODE_ENV !== "production") {
    global.prisma = exports.prisma;
}
exports.default = exports.prisma;
