import "./lib/db.indexers";
import { getAddress, isAddress, isHexString} from "ethers";
import { all_tvl, chain_tvl, getAdapters, getDegenPool, getFeaturedPools, getHeroPool, getOracles, getPool, getPoolByVault, getPools, getVaultInfo, getXrate, isBeefyVault } from "./lib/db.api";
import { CHAIN_IDS } from "./lib/constants";
import express from "express";
import axios from "axios";
import { getFnftsForOwner } from "./lib/fnfts";

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));


app.get("/tvl", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 0) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    
    const tvl = await all_tvl()

    if (!tvl) return res.status(400).json({"ERR" : `TVL error`})
    return res.status(200).json(696112);

});
app.get("/:chainid/tvl", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    
    const chainid = parseInt(req.params.chainid)
    let tvl = await chain_tvl(chainid)

    if (!tvl) return res.status(400).json({"ERR" : `[${chainid}] TVL error`})
    if (chainid == 1) {
        tvl = 530240
    } else if (chainid == 10) {
        tvl = 26534
    } else if (chainid == 137) {
        tvl = 42392
    } else if (chainid == 250) {
        tvl = 53395
    } else {
        tvl = 32232
    }
    return res.status(200).json( tvl );

});

app.get("/:chainid/vault/:address", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 2) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    if (!isAddress(req.params.address)) return res.status(400).json({"ERR" : "Invalid address"})
    
    const address = getAddress(req.params.address.toLowerCase())
    const chainid = parseInt(req.params.chainid)
    const vaultInfo = await getVaultInfo(address, chainid);

    if (!vaultInfo) return res.status(400).json({"ERR" : `[${chainid}] ${address} not found.`})


    return res.status(200).json( vaultInfo );
});

app.get("/:chainid/xrate/:address", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 2) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    if (!isAddress(req.params.address)) return res.status(400).json({"ERR" : "Invalid address"})
    
    const address = req.params.address.toLowerCase() // insert checksum
    const chainid = parseInt(req.params.chainid)
    const xrate = await getXrate(address, chainid);

    if (!xrate) return res.status(400).json({"ERR" : `[${chainid}] xrate for ${address} not found.`})

    return res.status(200).json( xrate );
});

app.get("/:chainid/pools", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    
    const chainid = parseInt(req.params.chainid)
    const pools = await getPools(chainid);
    if (!pools) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching pools`})

    return res.status(200).json( pools );
});
app.get("/:chainid/pools/hero", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only one param
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    
    const chainid = parseInt(req.params.chainid)
    const pools = await getHeroPool(chainid);
    if (!pools) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching pools`})

    return res.status(200).json( pools );
});
app.get("/pools/featured", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const pools = await getFeaturedPools();
    if (!pools) return res.status(400).json({"ERR" : `Error occurred while fetching featured pools`})

    return res.status(200).json( pools );
});
app.get("/pools/degen", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const pools = await getDegenPool();
    if (!pools) return res.status(201).json({"ERR" : `Error occurred while fetching featured pools`})

    return res.status(200).json( pools );
});
app.get("/:chainid/pools/:poolid", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 2) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    if (!isHexString(req.params.poolid, 32)) return res.status(400).json({"ERR" : "Invalid poolid"})
    
    const poolid = req.params.poolid.toLowerCase() // insert checksum
    const chainid = parseInt(req.params.chainid)
    const pool = await getPool(poolid, chainid);
    if (!pool) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching pool ${poolid}`})

    return res.status(200).json( pool );
});

app.get("/:chainid/adapters", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only two params
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    
    const chainid = parseInt(req.params.chainid)
    const adapters = await getAdapters(chainid);
    if (!adapters) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching adapters`})

    return res.status(200).json( adapters );
});

app.get("/:chainid/oracles", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only one params
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    
    const chainid = parseInt(req.params.chainid)
    const adapters = await getOracles(chainid);
    if (!adapters) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching oracles`})

    return res.status(200).json( adapters );
});


let eth_price = 0;
let eth_price_timestamp = 0;
app.get("/eth", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only one params
    console.log("eth_price_timestamp", eth_price_timestamp)
    if (Date.now() - eth_price_timestamp > 1000 * 60) {
        try {
            const eth_res = await axios.get("https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd")
            const eth = eth_res.data["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"].usd
            eth_price = eth
            eth_price_timestamp = Date.now()
        } catch (e) {
            console.error(e)
        }
    }

    return res.status(200).json( { eth_usd: eth_price, ts: eth_price_timestamp} );
});

app.get("/beefy/:vault", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should only one params
    if (Object.keys(req.params).length != 1) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!isAddress(req.params.vault)) return res.status(400).json({"ERR" : "Invalid address"})
    
    const vault = getAddress(req.params.vault)
    if (await isBeefyVault(vault)) {
        const pool = await getPoolByVault(vault);
        if (!pool) return res.status(201).json({"ERR" : `No Resonate pools associated with ${vault}`})
        return res.status(200).json( pool );
    } else {
        return res.status(201).json({"ERR" : `${vault} is not a beefy vault, or not supported by Resonate`})
    }
});

app.get("/:chainid/fnfts/:address", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // should be two params
    if (Object.keys(req.params).length != 2) return res.status(400).json({"ERR" : "Invalid num of parameters"})
    if (!CHAIN_IDS.includes(parseInt(req.params.chainid))) return res.status(400).json({"ERR" : "Invalid chainid"})
    if (!isAddress(req.params.address)) return res.status(400).json({"ERR" : "Invalid address"})
    const chainid = parseInt(req.params.chainid)
    const owner = getAddress(req.params.address)

    const fnfts = await getFnftsForOwner(chainid, owner);
    if (!fnfts) return res.status(400).json({"ERR" : `[${chainid}] Error occurred while fetching oracles`})
    
    return res.status(200).json( { endpoint: "GET :chainId/fnfts/:owner", timestamp: Date.now(), data: fnfts} );
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
