import { connectToDatabase, resonateDB } from "@resonate/db/index";
import { getCapitalActivated } from "@resonate/lib/eth.api";
import { getPoolQueues } from "@resonate/lib/service";
import axios from "axios";

describe("Getting prices and queue state", () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        resonateDB.destroy();
    });

    it("Can get queue state", async () => {
        const chainId = 42161;
        const poolId = "0x382f131e3d31b9693c7f405caf7aa104a336d3d720e22a51763372e037cfec0b";
        const queueState = await getPoolQueues(chainId, poolId);

        const res = await axios.get(
            `https://app.resonate.finance/api/get-queue-state?chainId=${chainId}&poolId=${poolId}`,
        );

        // console.log(res.data);
        console.log(queueState);
    });
});
