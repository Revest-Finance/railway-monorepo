import { connectToDatabase, ReduxProcessingEvent, ReduxRequest, resonateDB } from "@resonate/db";
import {
    insertProcessingEvents,
    insertRequestsWithShares,
    getLatestRatio,
    getLatestBlockNumber,
    getUserProfit,
} from "@resonate/db";

const processingEvent = {
    blockNumber: 1,
    blockTimestamp: new Date().toISOString(),
    ratio: 1,
    totalAssets: 1,
    txHash: "0x1",
};

const request = {
    shares: 1,
    assets: 1,
    txHash: "0x1",
    type: "RedeemRequestProcessed",
    userAddress: "0xuser",
};

describe("Verifies Redux DB integration", () => {
    beforeAll(async () => {
        await connectToDatabase();
        await resonateDB.getRepository(ReduxRequest).delete({});
        await resonateDB.getRepository(ReduxProcessingEvent).delete({});
    });

    afterEach(async () => {
        await resonateDB.getRepository(ReduxRequest).delete({});
        await resonateDB.getRepository(ReduxProcessingEvent).delete({});
    });

    afterAll(async () => {
        await resonateDB.destroy();
    });

    it("Can insert processing events", async () => {
        await insertProcessingEvents([processingEvent]);

        const result = await resonateDB.getRepository(ReduxProcessingEvent).find();

        expect(result.length).toBe(1);
        expect(result[0].blockNumber).toBe(1);
        expect(result[0].ratio).toBe(1);
        expect(result[0].totalAssets).toBe(1);
        expect(result[0].txHash).toBe("0x1");
    });

    it("Can insert requests with shares", async () => {
        await insertProcessingEvents([{ ...processingEvent, ratio: 0.5 }]);
        await insertRequestsWithShares([{ ...request, type: "RedeemRequestProcessed" }]);

        const [entry] = await resonateDB.getRepository(ReduxRequest).find();

        expect(entry.userAddress).toBe("0xuser");
        expect(entry.shares).toBe(2);
        expect(entry.assets).toBe(1);
        expect(entry.type).toBe("RedeemRequestProcessed");
    });

    it("Can insert multiple requests with shares", async () => {
        await insertProcessingEvents([{ ...processingEvent, ratio: 0.5 }]);
        await insertRequestsWithShares([
            { ...request, type: "DepositRequestProcessed" },
            { ...request, type: "RedeemRequestProcessed" },
        ]);

        const entries = await resonateDB.getRepository(ReduxRequest).find();

        expect(entries.length).toBe(2);
    });

    it("Can get latest ratio", async () => {
        const now = new Date().toISOString();
        const after = new Date(Date.now() + 1000).toISOString();

        await insertProcessingEvents([
            { ...processingEvent, blockNumber: 1, blockTimestamp: now, ratio: 1, txHash: "0x1" },
            { ...processingEvent, blockNumber: 2, blockTimestamp: after, ratio: 2, txHash: "0x2" },
        ]);

        const processingEvents = await resonateDB.getRepository(ReduxProcessingEvent).find();
        const ratio = await getLatestRatio();

        expect(processingEvents.length).toBe(2);
        expect(ratio).toBe(2);
    });

    it("Can get latest block number", async () => {
        await insertProcessingEvents([processingEvent, { ...processingEvent, blockNumber: 2 }]);

        const blockNumber = await resonateDB.getRepository(ReduxProcessingEvent).find();
        const latestBlockNumber = await getLatestBlockNumber();

        expect(blockNumber.length).toBe(2);
        expect(latestBlockNumber).toBe(2);
    });

    it("Can view personal metrics after profiting double", async () => {
        const now = new Date().toISOString();
        const after = new Date(Date.now() + 1000).toISOString();

        await insertProcessingEvents([
            { ...processingEvent, blockNumber: 1, blockTimestamp: now, ratio: 1, txHash: "0x1" },
            { ...processingEvent, blockNumber: 2, blockTimestamp: after, ratio: 2, txHash: "0x2" },
        ]);

        let stats = await getUserProfit("0xuser");

        expect(stats.assetValue).toBe(0);
        expect(stats.totalShares).toBe(0);
        expect(stats.totalAssetProfit).toBe(0);

        await insertRequestsWithShares([{ ...request, type: "DepositRequestProcessed" }]);

        stats = await getUserProfit("0xuser");

        expect(stats.assetValue).toBe(2);
        expect(stats.totalShares).toBe(1);
        expect(stats.totalAssetProfit).toBe(1);
    });

    it("Can view personal metrics after losing half", async () => {
        const now = new Date().toISOString();
        const after = new Date(Date.now() + 1000).toISOString();

        await insertProcessingEvents([
            { ...processingEvent, blockNumber: 1, blockTimestamp: now, ratio: 1, txHash: "0x1" },
            { ...processingEvent, blockNumber: 2, blockTimestamp: after, ratio: 0.5, txHash: "0x2" },
        ]);

        let stats = await getUserProfit("0xuser");

        expect(stats.assetValue).toBe(0);
        expect(stats.totalShares).toBe(0);
        expect(stats.totalAssetProfit).toBe(0);

        await insertRequestsWithShares([{ ...request, type: "DepositRequestProcessed" }]);

        stats = await getUserProfit("0xuser");

        expect(stats.assetValue).toBe(0.5);
        expect(stats.totalShares).toBe(1);
        expect(stats.totalAssetProfit).toBe(-0.5);
    });
});
