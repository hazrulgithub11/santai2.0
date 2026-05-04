import "dotenv/config";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { startServer } from "./server.js";

const config = loadConfig();
const app = createApp(config);

startServer(app, config);
