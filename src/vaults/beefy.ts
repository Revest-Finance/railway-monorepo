import axios from "axios";

import { readVaultsFromProvider, updateVault } from "@resonate/db";

const tickers: { [address: string]: { ticker: string } } = {
    "0x26F44884D9744C0EDaB6283930DF325c200020A3": { ticker: "convex-aleth-frxeth" },

    // 250
    "0x837BEe8567297dd628fb82FFBA193A57A9F6B655": { ticker: "spell-ftm-mim-crv" },
    "0x916dD4AB72550E944Fcb56FC1Cc18e07909d86AF": { ticker: "spiritV2-usdc-mim" },

    // 10
    "0x01D9cfB8a9D43013a1FdC925640412D8d2D900F0": { ticker: "velodrome-usdc-mai" },
    "0x48B3EdF0D7412B11c232BD9A5114B590B7F28134": { ticker: "velodrome-snx-usdc" },
    "0x107Dbf9c9C0EF2Df114159e5C7DC2baf7C444cFF": { ticker: "curve-op-f-susd" },
    "0xa8fd81A0ec43841b64cDAE13F1F6816108fD37FF": { ticker: "velodrome-usdc-dola" },
    "0x81F2F132465Ffb4B3C5d11f3d94582cC5c281c04": { ticker: "velodrome-velo-usdc" },
    "0x1b620BE62788e940b4c4ae6Df933c50981AcAB80": { ticker: "velodrome-weth-frxeth" },
    "0x06E0A84c71dBD037c618CCf90798474E0e6f9C91": { ticker: "velodrome-v2-weth-frxeth" },

    // 137
    "0xebe0c8d842AA5A57D7BEf8e524dEabA676F91cD1": { ticker: "mai-usdc-mimatic" },
    "0x3CB928f9B49D9bD6eF43B7310dcC17dB0528CCc6": { ticker: "mai-curve-mai-3pool" },

    // 42161
    "0x149f3dDeB5FF9bE7342D07C35D6dA19Df3F790af": { ticker: "sushi-arb-spell-weth" },
    "0x9dbbBaecACEDf53d5Caa295b8293c1def2055Adc": { ticker: "gmx-arb-glp" },
    "0x1B4dD8911cd2028Ea230f82E7BD91F1651Cb4AaB": { ticker: "curve-arb-usdc-usdm" },
};

interface BEEFY_APY_DATA {
    [name: string]: {
        vaultApr: number;
        compoundingsPerYear: number;
        beefyPerformanceFee: number;
        vaultApy: number;
        lpFee: number;
        tradingApr: number;
        totalApy: number;
    };
}
interface BEEFY_TVL_DATA {
    t: number;
    v: number;
}
export async function beefy() {
    const vaults = await readVaultsFromProvider("Beefy Finance");
    if (vaults.length === 0) {
        return;
    }

    const apyData = (
        await axios.get(`https://api.beefy.finance/apy/breakdown?_=${Date.now()}`, {
            headers: { "Accept-Encoding": "gzip,deflate,compress" },
        })
    ).data as BEEFY_APY_DATA;

    const vaultRequests = vaults.map(async vault => {
        if (!(vault.address in tickers)) {
            console.error(`Ticker not configured for ${vault.address} ${vault.name}`);
            return { address: vault.address, tvl: 0 };
        }

        const ticker = tickers[vault.address].ticker;

        const result = await axios.get(`https://data.beefy.finance/api/v2/tvls/?vault=${ticker}&bucket=1d_1M`);

        const data = result.data as BEEFY_TVL_DATA[];
        const { v: latestVolume } = data.length > 0 ? data.pop()! : { v: 0 };

        await updateVault({
            ...vault,
            apy: apyData[ticker].totalApy,
            tvl: latestVolume.toString(),
        });

        return { address: vault.address, tvl: latestVolume };
    });

    await Promise.all(vaultRequests);
}
