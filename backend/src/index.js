import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./auth/routes.js";
import postRoutes from "./post/routes.js";
import userRoutes from "./user/routes.js";
import settingsRoutes from "./settings/routes.js";
import { startPostDispatching } from "./post/cron.js";

const app = express();
app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json());
app.use(cookieParser());

// Registering routes
app.use("/auth", authRoutes);
app.use("/post", postRoutes);
app.use("/user", userRoutes);
app.use("/settings", settingsRoutes);

app.listen(3000, () => console.log("Posty running on: http://localhost:3000"));
startPostDispatching();
