import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./auth/routes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

// Registering routes
app.use("/auth", authRoutes);

app.listen(3000, () => console.log("Posty running on: http://localhost:3000"));
