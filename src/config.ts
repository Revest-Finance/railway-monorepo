import dotenv from "dotenv";

dotenv.config();

export const PORT = parseInt(process.env.PORT || "3333");

export const AUTH_KEY = process.env.AUTH_KEY!;

export const MYSQLHOST = process.env.MYSQLHOST!;
export const MYSQLUSER = process.env.MYSQLUSER!;
export const MYSQLPASSWORD = process.env.MYSQLPASSWORD!;
export const MYSQLDATABASE = process.env.MYSQLDATABASE!;
export const MYSQLPORT = parseInt(process.env.MYSQLPORT!);

export const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL!;
export const OPTIMISM_RPC_URL = process.env.OPTIMISM_RPC_URL!;
export const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL!;
export const FANTOM_RPC_URL = process.env.FANTOM_RPC_URL!;
export const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL!;

export const MONGO_DB_HOST = process.env.MONGO_DB_HOST!;
export const MONGO_DB_PORT = process.env.MONGO_DB_PORT!;
export const MONGO_DB_ROOT_USERNAME = process.env.MONGO_DB_ROOT_USERNAME!;
export const MONGO_DB_ROOT_PASSWORD = process.env.MONGO_DB_ROOT_PASSWORD!;
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME!;
