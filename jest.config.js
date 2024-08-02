"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    moduleFileExtensions: ["ts", "js", "json", "node"],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    setupFilesAfterEnv: ["./test/jest.setup.ts"],
    collectCoverage: false,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
    moduleNameMapper: {
        "^@src/(.*)$": "<rootDir>/src/$2",
    },
};
//# sourceMappingURL=jest.config.js.map