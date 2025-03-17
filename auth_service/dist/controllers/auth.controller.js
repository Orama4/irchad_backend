
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "24h";
const register = async (req, res) => {
    try {
        const { email, password, firstname, lastname, phonenumber, address, role = "normal", } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: role,
                    Profile: {
                        create: {
                            firstname,
                            lastname,
                            phonenumber,
                            address,
                        },
                    },
                },
            });
            // Based on role, create appropriate role-specific record
            if (role === "super" || role === "normal") {
                await tx.admin.create({
                    data: {
                        userId: user.id,
                        role: role,
                    },
                });
            }
            return user;
        });
        // Generate token
        /* const tokenPayload: TokenPayload = {
           userId: result.id,
           email: result.email,
           role: result.role || undefined,
         };*/
        /* const token = jwt.sign(tokenPayload, JWT_SECRET, {
           expiresIn: JWT_EXPIRES_IN,
         });*/
        res.status(201).json({
            success: true
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "An error occurred during registration" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Check password
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Generate token
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role || undefined,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred during login" });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                Profile: true,
                Admin: true,
                Commercial: true,
                Decider: true,
                EndUser: true,
                Helper: true,
                Maintainer: true,
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    }
    catch (error) {
        console.error("Get profile error:", error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching user profile" });
    }
};
exports.getProfile = getProfile;
