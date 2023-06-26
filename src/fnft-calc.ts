import cron from 'node-cron';
import { connect, readAllFNFTS, batchUpdateFNFTs } from './lib/db.indexers';
import { BigNumber, Contract, constants, providers, utils } from "ethers-v5"
import { CHAIN_IDS, PROVIDER_STRING, eth_price, fnft_handler_addresses, getDecimals, output_receiver_addresses, price_provider_addresses } from './lib/constants';
import { fnftHandlerABI, outputReceiverABI, priceProviderABI } from './lib/abi';
import { MulticallWrapper } from 'ethers-multicall-provider';

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
    console.log("Running FNFT valuation", chainId)
    const fnfts = await readAllFNFTS(chainId)
    const multicallProvider = MulticallWrapper.wrap(new providers.JsonRpcProvider(PROVIDER_STRING[chainId]))
    const output_receiver_multicall = new Contract(output_receiver_addresses[chainId], outputReceiverABI, multicallProvider)
    const fnft_handler_multicall = new Contract(fnft_handler_addresses[chainId], fnftHandlerABI, multicallProvider)
    const price_provider_multicall = new Contract(price_provider_addresses[chainId], priceProviderABI, multicallProvider)

    /**
     * For each fnft, look up the total supply, the value of each individual fnft, and the asset contained within
     */
    const supplies_values_assets = await Promise.all(
        [
            ...fnfts.map( fnft => fnft_handler_multicall.getSupply(fnft.fnftid).catch(() => BigNumber.from(0))),
            ...fnfts.map( fnft => output_receiver_multicall.getValue(fnft.fnftid).catch(() => BigNumber.from(0))),
            ...fnfts.map( fnft => output_receiver_multicall.getAsset(fnft.fnftid).catch(() => { console.log("0x0 asset returned", fnft.poolid); return constants.AddressZero }))
        ]
    )
    const third = supplies_values_assets.length / 3
    const supplies = supplies_values_assets.slice(0, third) as BigNumber[]
    const values = supplies_values_assets.slice(third, 2 * third) as BigNumber[]
    const assets = supplies_values_assets.slice(2 * third) as string[]
    /**
     * Multicall the xrate for each unique asset to save rpc load
     */
    const unique_assets = Array.from(new Set(assets));
    const xrates: {[asset: string] : BigNumber} = {} 
    await Promise.all([
        ...unique_assets.map( asset => price_provider_multicall.getSafePrice(asset).then((res: BigNumber) => xrates[asset] = res).catch(() => xrates[asset] = BigNumber.from(0)))
    ])
    console.table(xrates)

    /**
     * Update each fnft usd field in the database. Oracle failures will be caught here,
     * in the event that an fnft is marked down to zero, we will not update the database
     */
    const _fnfts = fnfts
        .filter( (_, i) => xrates[assets[i]] && xrates[assets[i]].gt(0))
        .map( (fnft, i) => {
            const supplyOfFNFT = parseInt(supplies[i].toString())
            const totalAssetsInFNFT = supplyOfFNFT * parseFloat(utils.formatUnits(values[i], getDecimals(assets[i], chainId)))
            const totalUsd = eth * totalAssetsInFNFT * parseFloat(utils.formatUnits(xrates[assets[i]], 18))
            return { ...fnft, usd: totalUsd, face: supplyOfFNFT }
        })
    console.table(_fnfts)
    await batchUpdateFNFTs(_fnfts)
}


const main = async () => {
    await connect();
    cron.schedule(`*/1 * * * *`, async () => {
        eth = await eth_price()
        await Promise.all(CHAIN_IDS.map( id => {
            run(id)
        }))
    });
}

main().then()