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

app.get("/health", (req, res) => {
	res.json({
		status: "ok",
		service: "posty-backend",
		timestamp: new Date().toISOString(),
	});
});


app.listen(3000, () => {
	console.log("=================================");
	console.log("Posty Backend Server Started");
	console.log("Running on: http://localhost:3000");
	console.log(`Database: ${process.env.PGDATABASE || "not specified"}`);
	console.log("=================================");
});

startPostDispatching();
