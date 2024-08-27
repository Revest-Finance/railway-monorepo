import { grindAPYTVL, grindPoolVolume, volumeForPool } from "@resonate/crons";
import { Adapter, connectToDatabase, getPool, resonateDB } from "@resonate/db";
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

    it("Gets pool volume", async () => {
        // const pool = await getPool(1, "0x87fba2beecef9c43e9c5058ca52c2dcd2605e3af9afbf78a91e7b8027fae00c7");

        await grindPoolVolume();
    });
});
