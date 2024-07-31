import { Contract, JsonRpcProvider } from "ethers";
import { MulticallWrapper } from "ethers-multicall-provider";

import { fnftHandlerABI } from "./abi";
import { PROVIDER_STRING, fnft_handler_addresses } from "./constants";

export interface FnftsOwnerResponse {
    fnftId: number;
    balance: number;
}

export async function getFnftsForOwner(chainId: number, owner: string): Promise<FnftsOwnerResponse[]> {
    const multicallProvider = MulticallWrapper.wrap(new JsonRpcProvider(PROVIDER_STRING[chainId]));

    const fnftHandler = new Contract(fnft_handler_addresses[chainId], fnftHandlerABI, multicallProvider);

    const totalFnfts = (await fnftHandler.getNextId()) as BigInt;
    const fnftIds = Array.from(Array(Number(totalFnfts)).keys());

    const fnftBalanceRequests = fnftIds.map(fnftId => fnftHandler.balanceOf(owner, fnftId).catch(() => 0n));

    const balances = await Promise.all(fnftBalanceRequests);

    return balances
        .map((balance, index) => {
            return { fnftId: index, balance: balance.toNumber() };
        })
        .filter(fnft => fnft.balance > 0);
}
