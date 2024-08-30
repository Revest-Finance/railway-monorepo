import { grindQueue } from "@resonate/crons/queues";
import { connectToDatabase, getEnqueuedEvents, resonateDB } from "@resonate/db/index";

describe("Tests ETH module", () => {
    it("Verifies that the cron job runs appropriately", async () => {
        await connectToDatabase();

        await grindQueue(42161);

        const events = await getEnqueuedEvents({ chainId: 1 });

        expect(events).toBeDefined();

        const firstRecord = {
            "id": events[0].id,
            "chainId": 1,
            "poolId": "0xf03acbaa321d5c7005e8016dc437006b2d7b05ca40bd216600047f46f26195bb",
            "position": 1,
            "side": "EnqueueConsumer",
            "shouldFarm": true,
            "address": "0x8cA573430Fd584065C080fF1d2eA1a8DfB259Ae8",
            "packetsRemaining": "10000",
            "depositedShares": "1000000000000000000000000000000000",
            "orderOwner": "0x8ca573430fd584065c080ff1d2ea1a8dfb259ae8",
            "blockNumber": 15669739,
            "blockTimestamp": new Date("2022-10-03T19:34:11.000Z"),
            "lastKnownBlock": undefined,
            "transactionHash": "0x1f20a7ebc94ce1c5c7a5703d9e2eccf07466b9ff2831a8cee3b5381443791a3e",
        };

        expect({
            ...events[0],
            lastKnownBlock: undefined,
        }).toEqual(firstRecord);
    });

    afterAll(async () => {
        await resonateDB.destroy();
    });
});
