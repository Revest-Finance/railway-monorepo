import {
    CHAIN_IDS,
    PROVIDER_STRING,
    eth_price,
    fnft_handler_addresses,
    getDecimals,
    output_receiver_addresses,
    price_provider_addresses,
} from "@resonate/lib/constants";
import { fnftHandlerABI, outputReceiverABI, priceProviderABI } from "@resonate/lib/abi";
import { MulticallWrapper } from "ethers-multicall-provider";
import { Contract, formatUnits, JsonRpcProvider, ZeroAddress } from "ethers";
import { batchUpdateFNFTs, readAllFNFTS } from "@resonate/db";

/**
 * POC for calculating the value of FNFTs
 * 
    const target = fnfts[0]
    const target_supply = await fnft_handler_multicall.getSupply(target.fnftid)
    const target_asset = await output_receiver_multicall.getAsset(target.fnftid)
    const target_value = await output_receiver_multicall.getValue(target.fnftid)
    console.log(`[${chainId}] [id=${target.fnftid}] [supply=${target_supply}] [asset=${target_asset}] [value=${target_value}]`)

    const xrate = await price_provider_multicall.getSafePrice(target_asset)
    console.log(`[${chainId}] [asset=${target_asset}] [xrate=${xrate}]`)
    const decimals = getDecimals(target_asset, chainId)

    const totalAssetsInFNFT = target_supply * parseFloat(utils.formatUnits(target_value, decimals)) // 53 * 0.0001 = 0.0053 steCRV
    const totalUsd = eth * totalAssetsInFNFT * parseFloat(utils.formatUnits(xrate, 18))
    console.log(`[${chainId}] [totalAssetsInFNFT=${totalAssetsInFNFT}] [totalUsd=${totalUsd}]`) // $1700eth * 0.0053 * $1800
 */

let eth = 0;
/**
 * Update the valuations for all FNFTs for a given chainid
 * @param chainId
 */
const run = async (chainId: number) => {
    console.log("Running FNFT valuation", chainId);
    const fnfts = await readAllFNFTS(chainId);
    const multicallProvider = MulticallWrapper.wrap(new JsonRpcProvider(PROVIDER_STRING[chainId]));

    const output_receiver_multicall = new Contract(
        output_receiver_addresses[chainId],
        outputReceiverABI,
        multicallProvider.provider,
    );
    const fnft_handler_multicall = new Contract(fnft_handler_addresses[chainId], fnftHandlerABI, multicallProvider);
    const price_provider_multicall = new Contract(
        price_provider_addresses[chainId],
        priceProviderABI,
        multicallProvider,
    );

    /**
     * For each fnft, look up the total supply, the value of each individual fnft, and the asset contained within
     */
    const supplies_values_assets = await Promise.all([
        ...fnfts.map(fnft => fnft_handler_multicall.getSupply(fnft.fnftId).catch(() => 0n)),
        ...fnfts.map(fnft => output_receiver_multicall.getValue(fnft.fnftId).catch(() => 0n)),
        ...fnfts.map(fnft =>
            output_receiver_multicall.getAsset(fnft.fnftId).catch(() => {
                return ZeroAddress;
            }),
        ),
    ]);
    const third = supplies_values_assets.length / 3;
    const supplies = supplies_values_assets.slice(0, third) as BigInt[];
    const values = supplies_values_assets.slice(third, 2 * third) as BigInt[];
    const assets = supplies_values_assets.slice(2 * third) as string[];
    /**
     * Multicall the xrate for each unique asset to save rpc load
     */
    const unique_assets = Array.from(new Set(assets));
    const xrates: { [asset: string]: bigint } = {};
    await Promise.all([
        ...unique_assets.map(asset =>
            price_provider_multicall
                .getSafePrice(asset)
                .then((res: bigint) => (xrates[asset] = res))
                .catch(() => (xrates[asset] = 0n)),
        ),
    ]);
    console.table(xrates);

    /**
     * Update each fnft usd field in the database. Oracle failures will be caught here,
     * in the event that an fnft is marked down to zero, we will not update the database
     */
    const _fnfts = fnfts
        .filter((_, i) => xrates[assets[i]] && xrates[assets[i]] > 0n)
        .map((fnft, i) => {
            const supplyOfFNFT = parseInt(supplies[i].toString());
            const totalAssetsInFNFT =
                supplyOfFNFT * parseFloat(formatUnits(values[i] as bigint, getDecimals(assets[i], chainId)));
            const totalUsd = eth * totalAssetsInFNFT * parseFloat(formatUnits(xrates[assets[i]], 18));
            return { ...fnft, usd: totalUsd.toString(), face: supplyOfFNFT };
        });

    console.table(_fnfts);
    await batchUpdateFNFTs(_fnfts);
};

export const grindFNFTCalc = async () => {
    console.log("Grinding FNFTs/Calc at", new Date().toISOString());
    eth = await eth_price();
    const result = await Promise.allSettled(
        CHAIN_IDS.map(id => {
            run(id);
        }),
    );

    for (const res of result) {
        if (res.status === "rejected") {
            console.error(res.reason);
        }
    }

    console.log("Finished grinding FNFTs/Calc at", new Date().toISOString());
};
