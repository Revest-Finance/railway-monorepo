import axios from "axios";
import { isAddress } from "ethers";
import { Request, Response } from "express";

import { Cache } from "@resonate/lib/cache";
import { CHAIN_IDS, toCoingeckoPlatform } from "@resonate/lib/constants";
import { getEthPrice } from "@resonate/lib/prices";

const cache = new Cache();
const cacheDuration = 1000 * 60;

export async function handleGetEthPrice(_: Request, res: Response) {
    const price = cache.get("eth_usd");

    if (price) {
        return res.status(200).json({ eth_usd: price, ts: Date.now() });
    }

    const ethPrice = await getEthPrice();

    cache.set("eth_usd", ethPrice, cacheDuration);

    return res.status(200).json({ eth_usd: ethPrice, ts: Date.now() });
}

export async function handleGetUSDPrice(req: Request, res: Response) {
    if (!CHAIN_IDS.includes(parseInt(req.params.chainId))) {
        return res.status(400).json({ ERR: "Invalid chainid" });
    }

    if (!isAddress(req.params.address)) {
        return res.status(400).json({ ERR: "Invalid address" });
    }

    const address = req.params.address.toLowerCase();
    const chainId = parseInt(req.params.chainId);

    const cachedPrice = cache.get(`${chainId}_usd_${address}`);

    if (cachedPrice) {
        return res.status(200).json({
            usd: cachedPrice,
            ts: Date.now(),
        });
    }

    try {
        const price_res = await axios.get(
            `https://api.coingecko.com/api/v3/simple/token_price/${toCoingeckoPlatform[chainId]}?contract_addresses=${address}&vs_currencies=usd`,
        );
        const price = price_res.data[address].usd;
        cache.set(`${chainId}_usd_${address}`, price, cacheDuration);

        return res.status(200).json({
            usd: price,
            ts: Date.now(),
        });
    } catch (e) {
        console.error(e);
        cache.set(`${chainId}_usd_${address}`, 0, cacheDuration);
    }

    return res.status(200).json({
        usd: 0,
        ts: Date.now(),
    });
}
