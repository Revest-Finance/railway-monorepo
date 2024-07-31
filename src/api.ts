import express from "express";

import { PORT } from "@resonate/config";
import router from "@resonate/router";

const init = async () => {
    console.log("Starting server...");

    const app = express();

    app.use((_, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        next();
    });

    app.use(express.json());
    app.use(express.raw({ type: "application/vnd.custom-type" }));
    app.use(express.text({ type: "text/html" }));
    app.use(router);

    app.listen(PORT, () => {
        console.log(`Listening on port: ${PORT}`);
    });
};

init();
