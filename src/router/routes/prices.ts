import axios from "axios";
import { isAddress } from "ethers";
import { Request, Response } from "express";

import { Cache } from "@resonate/lib/cache";
import { CHAIN_IDS, toCoingeckoPlatform } from "@resonate/lib/constants";

const cache = new Cache(1000 * 60);

const ethPriceUrl =
    "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd";

export async function handleGetEthPrice(_: Request, res: Response) {
    const price = cache.get("eth_usd");

    if (price) {
        return res.status(200).json({ eth_usd: price.value, ts: price.timestamp });
    }

    try {
        const eth_res = await axios.get(ethPriceUrl);
        const eth = eth_res.data["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"].usd;
        cache.set("eth_usd", eth);
        return res.status(200).json({ eth_usd: eth, ts: Date.now() });
    } catch (e) {
        console.error(e);
    }

    return res.status(200).json({ eth_usd: 0, ts: Date.now() });
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
            usd: cachedPrice.value,
            ts: cachedPrice.timestamp,
        });
    }

    try {
        const price_res = await axios.get(
            `https://api.coingecko.com/api/v3/simple/token_price/${toCoingeckoPlatform[chainId]}?contract_addresses=${address}&vs_currencies=usd`,
        );
        const price = price_res.data[address].usd;
        cache.set(`${chainId}_usd_${address}`, price);

        return res.status(200).json({
            usd: price,
            ts: Date.now(),
        });
    } catch (e) {
        console.error(e);
        cache.set(`${chainId}_usd_${address}`, 0);
    }

    return res.status(200).json({
        usd: 0,
        ts: Date.now(),
    });
}
