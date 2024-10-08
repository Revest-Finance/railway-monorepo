import { Mutex } from "@resonate/utils/mutex";
import axios from "axios";
import { Cache } from "./cache";

const ethPriceUrl =
    "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd";

const ethCache = new Cache();
const cacheDuration = 1000 * 30;

const mutex = new Mutex();

export async function getEthPrice(): Promise<number> {
    await mutex.lock();

    if (ethCache.has("price")) {
        mutex.unlock();
        return Number(ethCache.get("price"));
    }

    try {
        const ethRes = await axios.get(ethPriceUrl);

        const { usd: price } = ethRes.data["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"];

        ethCache.set("price", price, cacheDuration);

        return price;
    } catch (e) {
        return 0;
    } finally {
        mutex.unlock();
    }
}
