import cron from 'node-cron';
import { CHAIN_IDS, E16, E18, PROVIDER_STRING, eth_price, isCrossAsset, price_provider_addresses } from './lib/constants';
import { connect, readPools, updatePoolTVL } from './lib/db.indexers';
import axios from 'axios';
import { BigNumber, Contract, providers, utils } from 'ethers-v5';
import { MulticallWrapper } from 'ethers-multicall-provider';
import { priceProviderABI } from './lib/abi';
import { QueueState } from './lib/interfaces';
let eth = 0;

const delay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const run = async (chainId: number) => {
    console.log("Running pool tvl indexer for chainId", chainId)
    const multicallProvider = MulticallWrapper.wrap(new providers.JsonRpcProvider(PROVIDER_STRING[chainId]))
    const price_provider_multicall = new Contract(price_provider_addresses[chainId], priceProviderABI, multicallProvider)
    /**
     * Need all pools and the exchange rate for each asset
     */
    const pools = await readPools(chainId)
    const xrates: {[asset: string] : BigNumber} = {} 
    const unique_assets = Array.from(
        new Set([...pools.map(pool => pool.payoutasset), ...pools.map(pool => pool.vaultasset)])
    )
    await Promise.all([
        ...unique_assets.map( asset => price_provider_multicall.getSafePrice(asset).then((res: BigNumber) => xrates[asset] = res).catch(() => xrates[asset] = BigNumber.from(0)))
    ])
    console.table(xrates)

    /**
     * Need the queue state for each pool
     */
    for await (const pool of pools) {
        const queue_state = await axios.get(`https://app.resonate.finance/api/get-queue-state?chainId=${pool.chainid}&&poolId=${pool.poolid}`)
        const queueState = queue_state.data as QueueState
        let total = BigNumber.from(0)
        const token = queueState.isProducer ? pool.payoutasset : pool.vaultasset
        const packetsizedivisor: BigNumber = BigNumber.from(10).pow(pool.packetsizedecimals);
        if (!queueState.isProducer) {
            total = BigNumber.from(queueState.total).mul(BigNumber.from(pool.packetsize)).div(packetsizedivisor);
        } else if (!isCrossAsset(pool)) {
            total = BigNumber.from(queueState.total).mul(BigNumber.from(pool.packetsize)).mul(BigNumber.from(pool.rate)).div(E16).div(E18);
        } else {
            total = BigNumber.from(0);
            for (const order of queueState.events) {
                total = total.add(
                    BigNumber.from(order.packetsRemaining)
                        .mul(BigNumber.from(pool.packetsize))
                        .mul(BigNumber.from(pool.rate))
                        .mul(order.depositedShares)
                        .div(E16)
                        .div(E18)
                        .div(packetsizedivisor)
                );
            }
        }
        const tvl = eth * parseFloat(utils.formatUnits(xrates[token], 18)) * parseInt(total.toString()) / 100
        await updatePoolTVL(pool, tvl);
        console.log(pool.chainid, "queue state tvl for ", pool.poolname, " is ", tvl)
    }
}


const main = async () => {
    await connect();
    // This runs once an hour because it is very expensive
    for (const id of CHAIN_IDS) {
        try {
            cron.schedule(`*/1 * * * *`, async () => {
                eth = await eth_price();
                run(id)
            });
            delay(10000)
        } catch (e) {
            console.error(`[${id}] ${e}`)
        }
    }

}

main().then()