import cron from 'node-cron';
import { connect, updateFNFT, readAllFNFTS } from './lib/db';
import { BigNumber, Contract, constants, providers, utils } from "ethers-v5"
import { CHAIN_IDS, E6_addresses, PROVIDER_STRING, eth_price, fnft_handler_addresses, output_receiver_addresses, price_provider_addresses } from './lib/constants';
import { fnftHandlerABI, outputReceiverABI, priceProviderABI } from './lib/abi';
import { MulticallWrapper } from 'ethers-multicall-provider';

let eth = 0;

const run = async (chainId: number) => {
    console.log("Running FNFT valuation")
    const fnfts = await readAllFNFTS(chainId)
    const multicallProvider = MulticallWrapper.wrap(new providers.JsonRpcProvider(PROVIDER_STRING[chainId]))
    const output_receiver_multicall = new Contract(output_receiver_addresses[chainId], outputReceiverABI, multicallProvider)
    const fnft_handler_multicall = new Contract(fnft_handler_addresses[chainId], fnftHandlerABI, multicallProvider)
    const price_provider_multicall = new Contract(price_provider_addresses[chainId], priceProviderABI, multicallProvider)

    // fetch all face_values and assets
    const results = await Promise.all(
        [
            ...fnfts.map( fnft => fnft_handler_multicall.getSupply(fnft.fnftid).catch(() => BigNumber.from(0))),
            ...fnfts.map( fnft => output_receiver_multicall.getValue(fnft.fnftid).catch(() => BigNumber.from(0))),
            ...fnfts.map( fnft => output_receiver_multicall.getAsset(fnft.fnftid).catch(() => constants.AddressZero))
        ]
    )
    const third = results.length / 3
    const face_asset_pairs: { supply: BigNumber, value: BigNumber, asset: string}[] = results.slice(0, third).map( (result: BigNumber, i: number) => {
        return {
            supply: result,
            value: results[i + third] as BigNumber,
            asset: results[i + ( 2 * third)] as string
        }
    })
    // // fetch the price of every unique asset
    const unique_assets = Array.from(new Set(face_asset_pairs.map(x => x.asset)));
    const xrates: {[asset: string] : BigNumber} = {} 
    await Promise.all([
        ...unique_assets.map( asset => price_provider_multicall.getSafePrice(asset).then((res: BigNumber) => xrates[asset] = res).catch(() => xrates[asset] = BigNumber.from(0))),
    ])
    await Promise.all(face_asset_pairs.map( async (pair, i) => {
        const decimals = E6_addresses[chainId].includes(utils.getAddress(pair.asset)) ? 6 : 18;
        if (xrates[pair.asset]) {
            const totalUsd = eth * parseFloat(utils.formatUnits(
                pair.value.mul(pair.supply).mul(xrates[pair.asset]), decimals + 18
            ))
            await updateFNFT(fnfts[i].fnftid, fnfts[i].poolid, chainId, totalUsd, totalUsd)
        } else {
            console.error(`[${chainId}] [id=${fnfts[i].fnftid}] xrate not found`)
        }
    }))
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