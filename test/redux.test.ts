import { handleGetIndividualStatistics } from "../src/lib/redux";

describe("Verifies Redux functionality", () => {
    it("Should return proper simplified individual PnL", async () => {
        // const pnls = await getIndividualPnLSimplified("0xb61d80D78214AE467B4183826dA2a21882728F6d");
        // console.log(pnls);
    });

    it("Should return proper individual PnL", async () => {
        // const pnls = await getIndividualPnL("0xb61d80D78214AE467B4183826dA2a21882728F6d");
        // console.log(pnls);
    });

    it("Should get all statistics", async () => {
        const result = await handleGetIndividualStatistics("0x442cD3D136b7c3e48903Bbc3c93DeE7802d23970");

        console.log(result);
    });
});
