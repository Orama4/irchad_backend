"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth/routes/auth.routes.ts
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
// Protected routes
router.get("/profile", authMiddleware_1.authenticateToken, auth_controller_1.getProfile);
// Example of role-based protected route
router.get("/admin", authMiddleware_1.authenticateToken, (0, authMiddleware_1.authorizeRole)(["super"]), (req, res) => {
    res.json({ message: "Admin access granted" });
});
exports.default = router;
