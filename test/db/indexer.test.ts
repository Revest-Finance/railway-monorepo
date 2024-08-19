import { grindAPYTVL } from "@resonate/crons";
import { Adapter, connectToDatabase, resonateDB } from "@resonate/db";
import { getPoolCreations } from "@resonate/lib/eth.api";

describe("Verifies writes are possible to the DB for indexer ops", () => {
    beforeAll(async () => {
        await connectToDatabase();
        await resonateDB.getRepository(Adapter).delete({});
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

    it("Grinds vault APY and TVL", async () => {
        // await grindAPYTVL();
    });

    it("Gets pools", async () => {
        const result = await getPoolCreations(1);

        console.log(result);
    });
});
