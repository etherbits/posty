import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import db from "./db/index.js";

const app = express();
app.use(cookieParser());

app.get("/test", async (req, res) => {
	const result = await db.query("SELECT NOW()");

	return res.json(result.rows);
});

app.listen(3000, () => console.log("Posty running on: http://localhost:3000"));
