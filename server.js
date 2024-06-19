import express from "express";
import path from "node:path";
import cors from "cors";

const app = express();
const port = process.env.PORT ?? 4030;
const buildDir = path.resolve(process.cwd(), "dist");

app.use(cors());
app.use(
	express.static(buildDir, {
		extensions: ["html", "htm"]
	})
);
app.listen(port, () => console.log(`Listening on port ${port}`));
