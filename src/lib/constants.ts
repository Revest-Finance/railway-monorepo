import axios from "axios";
import { JsonRpcProvider, getAddress } from "ethers";
import { Pool } from "./interfaces";
import { BigNumber } from "ethers-v5";
import { ARBITRUM_RPC_URL, FANTOM_RPC_URL, MAINNET_RPC_URL, OPTIMISM_RPC_URL, POLYGON_RPC_URL } from "../config";

export const ZERO = BigNumber.from(0);
export const ONE = BigNumber.from(1);
export const E14 = BigNumber.from(10).pow(14);
export const E15 = BigNumber.from(10).pow(15);
export const E16 = BigNumber.from(10).pow(16);
export const E17 = BigNumber.from(10).pow(17);
export const E18 = BigNumber.from(10).pow(18);

export const SUBGRAPH_URLS: { [chainid: number]: string } = {
    1: "https://gateway-arbitrum.network.thegraph.com/api/66a3a8233f632931e743d94d213db41a/subgraphs/id/5VN4pwrUSj5dUk2NGPFka5vwGfurSk5N9ZqdbgVkJPjy",
    10: "https://gateway-arbitrum.network.thegraph.com/api/66a3a8233f632931e743d94d213db41a/subgraphs/id/3UHvfE7EHUUfm49YujaSyKDEuZhW4E1kR2qCtSpHwVZd",
    137: "https://gateway-arbitrum.network.thegraph.com/api/66a3a8233f632931e743d94d213db41a/subgraphs/id/7zUaDXJ2JQSDGU9j8jqAb449XstUFCDT1XLNoCDh8dp3",
    250: "https://gateway-arbitrum.network.thegraph.com/api/66a3a8233f632931e743d94d213db41a/subgraphs/id/3oo4MLHw1gQmHzCeLk3RtbUXebZkfqRhvNb5Js8oNdWq",
    42161: "https://gateway-arbitrum.network.thegraph.com/api/66a3a8233f632931e743d94d213db41a/subgraphs/id/DoUeTsLcWTdm17T5D2Z7nkJggj2WwJqvG3YvNAZPSxU7",
};

export const PROVIDER_STRING: { [chainid: number]: string } = {
    1: MAINNET_RPC_URL,
    10: OPTIMISM_RPC_URL,
    137: POLYGON_RPC_URL,
    250: FANTOM_RPC_URL,
    42161: ARBITRUM_RPC_URL,
};

export const PROVIDERS: { [chainId: number]: JsonRpcProvider } = {
    1: new JsonRpcProvider(MAINNET_RPC_URL),
    10: new JsonRpcProvider(OPTIMISM_RPC_URL),
    137: new JsonRpcProvider(POLYGON_RPC_URL),
    250: new JsonRpcProvider(FANTOM_RPC_URL),
    42161: new JsonRpcProvider(ARBITRUM_RPC_URL),
    31337: new JsonRpcProvider("http://localhost:8545"),
};

export const CHAIN_IDS = [1, 10, 137, 250, 42161];

export const toCoingeckoPlatform: { [chainid: number]: string } = {
    1: "ethereum",
    42161: "arbitrum-one",
};

export const eth_price = async (): Promise<number> => {
    const eth_res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd",
    );
    return eth_res.data["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"].usd;
};

export const price_provider_addresses: { [chainId: number]: string } = {
    1: "0x0F89ba3F140Ea9370aB05d434B8e32fDf41a6093",
    10: "0x0F89ba3F140Ea9370aB05d434B8e32fDf41a6093",
    137: "0xDe953B2826AD2df2706829bBAe860b17330334df",
    250: "0x0F89ba3F140Ea9370aB05d434B8e32fDf41a6093",
    42161: "0x0F89ba3F140Ea9370aB05d434B8e32fDf41a6093",
};
export const token_vault_addresses: { [chainId: number]: string } = {
    1: "0xD672f1E3411c23Edbb49e8EB6C6b1564b2BF8E17",
    10: "0x490867a64746AC33f721A778dD8C30BBb0074055",
    137: "0xd2c6eB7527Ab1E188638B86F2c14bbAd5A431d78",
    250: "0x0ca61c96d1E0bE5F80f4773be367f4bF2025f224",
    42161: "0x209F3F7750d4CC52776e3e243717b3A8aDE413eB",
};

export const output_receiver_addresses: { [chainId: number]: string } = {
    1: "0x8f74c989252B94Fd2d08a668884D303D57c91422",
    10: "0x8f74c989252B94Fd2d08a668884D303D57c91422",
    137: "0x6EEbe55c1cF07155726d767E5F4D279cB4905539",
    250: "0x8f74c989252B94Fd2d08a668884D303D57c91422",
    42161: "0x8f74c989252B94Fd2d08a668884D303D57c91422",
};
export const fnft_handler_addresses: { [chainId: number]: string } = {
    1: "0xa07E6a51420EcfCB081917f40423D29529705e8a",
    10: "0xA002Dc3E3C163732F4F5e6F941C87b61B5Afca74",
    137: "0x6c111d0b0C5f6577DE586F7Df262f15a6741ddb7",
    250: "0xA6f5efC3499d41fF1Eca9d325cfe13C913a85F45",
    42161: "0xd90D465631a1718FDB3eA64C39F41290Addf70da",
};

export const E6_addresses: { [chainId: number]: string[] } = {
    1: [
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "0xF6c3583b1B68C47ceb981bE651B8fCBB1A11Fd25",
    ],
    10: ["0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"],
    137: ["0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"],
    250: ["0x04068DA6C83AFCFA0e13ba15A6696662335D5B75"],
    42161: ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"],
    31337: ["0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"],
};

export const getDecimals = (address: string, chainId: number) => {
    return E6_addresses[chainId].includes(getAddress(address)) ? 6 : 18;
};

export const isCrossAsset = (pool: Pool) => {
    return getAddress(pool.payoutasset) != getAddress(pool.vaultasset);
};
