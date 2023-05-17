import { PROVIDER_STRING, fnft_handler_addresses } from "./constants";
import { MulticallWrapper } from "ethers-multicall-provider";
import { BigNumber, Contract, providers } from "ethers-v5";
import { fnftHandlerABI } from "./abi";

export const getFnftsForOwner = async (chainid: number, owner: string) : Promise<{ fnftId: number, balance: number}[] | undefined> =>{
    const multicallProvider = MulticallWrapper.wrap(new providers.JsonRpcProvider(PROVIDER_STRING[chainid]))
    const fnftHandler = new Contract(fnft_handler_addresses[chainid], fnftHandlerABI, multicallProvider)
    const n = await fnftHandler.getNextId() as BigNumber
    const balances = await Promise.all([
        ...Array.from(Array(n.toNumber()).keys()).map( id => fnftHandler.balanceOf(owner, id).catch(() => BigNumber.from(0)))
    ])
    return balances.map((balance, index) => { return { fnftId: index, balance: balance.toNumber() }}).filter((fnft) => fnft.balance > 0)
}