module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    moduleNameMapper: {
        "@resonate/(.*)": "<rootDir>/src/$1",
        "@test/(.*)": "<rootDir>/test/$1",
    },
};
