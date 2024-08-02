declare const _default: {
    preset: string;
    testEnvironment: string;
    testMatch: string[];
    moduleFileExtensions: string[];
    transform: {
        "^.+\\.ts$": string;
    };
    setupFilesAfterEnv: string[];
    collectCoverage: boolean;
    coverageDirectory: string;
    coverageReporters: string[];
    moduleNameMapper: {
        "^@src/(.*)$": string;
    };
};
export default _default;
