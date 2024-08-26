import { Adapter, connectToDatabase, resonateDB } from "@resonate/db";

describe("Verifies queries are possible to the DB for indexer ops", () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await resonateDB.getRepository(Adapter).delete({});
        await resonateDB.destroy();
    });

    // Test placeholder
    //
    it("Grinds adapter by chain Id", async () => {
        // await indexAdaptersByChain(1);
    });

    it("Grinds vault APY and TVL", async () => {});
});
