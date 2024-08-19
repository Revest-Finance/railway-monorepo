import express from "express";

import { PORT } from "@resonate/config";
import router from "@resonate/router";
import TaskScheduler from "./task-scheduler";
import { connectToDatabase } from "./db";

const init = async () => {
    console.log("Starting server...");

    await connectToDatabase();

    console.log("Connected to database");

    const app = express();

    app.use((_, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        next();
    });

    app.use(express.json());
    app.use(express.raw({ type: "application/vnd.custom-type" }));
    app.use(express.text({ type: "text/html" }));
    app.use(router);

    TaskScheduler.start();

    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`);
    });
};

init();
