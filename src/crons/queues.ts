import { addEnqueuedEvents, getLatestEnqueueBlock } from "@resonate/db";
import { CHAIN_IDS } from "@resonate/lib/constants";
import { extractEnqueuedEvents } from "@resonate/lib/eth.api";

export async function grindQueue(chainId: number) {
    const lastKnownBlock = await getLatestEnqueueBlock(chainId);

    const providerEvents = await extractEnqueuedEvents(chainId, "EnqueueProvider", lastKnownBlock);
    const consumerEvents = await extractEnqueuedEvents(chainId, "EnqueueConsumer", lastKnownBlock);

    const events = providerEvents.concat(consumerEvents);

    if (events.length === 0) {
        return;
    }

    await addEnqueuedEvents(events);
}

export async function grindQueues() {
    const requests = CHAIN_IDS.map(grindQueue);

    console.log("Grinding queues at", new Date().toISOString());

    const results = await Promise.allSettled(requests);

    for (const result of results) {
        if (result.status === "rejected") {
            console.error(result.reason);
        }
    }

    console.log("Finished grinding queues at", new Date().toISOString());
}
