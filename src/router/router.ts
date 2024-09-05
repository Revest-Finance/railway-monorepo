import express from "express";

import {
    handleChainTVL,
    handleGetAdapters,
    handleGetDegenPools,
    handleGetFeaturedPools,
    handleGetFNFTs,
    handleGetHeroPools,
    handleGetIndividualStatistics,
    handleGetOracles,
    handleGetPoints,
    handleGetPoolsByName,
    handleGetPools,
    handleGetPoolsById,
    handleGetReduxStatistics,
    handleGetXrate,
    handleTVL,
    handleUpdateReduxStatistics,
    handleGetEnqueuedEvents,
    handleGetQueueState,
    handleGetDetailedPools,
    handleGetTokens,
} from "./routes";
import { handleGetBeefyVault, handleGetVault } from "./routes/vaults";
import { handleGetEthPrice, handleGetUSDPrice } from "./routes/prices";

const router = express.Router();

router.get("/tvl", handleTVL);
router.get("/:chainId/tvl", handleChainTVL);

router.get("/:chainId/vault/:address", handleGetVault);
router.get("/beefy/:vault", handleGetBeefyVault);

router.get("/:chainId/xrate/:address", handleGetXrate);

router.get("/pools/:chainId", handleGetDetailedPools);
router.get("/pools/featured", handleGetFeaturedPools);
router.get("/pools/degen", handleGetDegenPools);
router.get("/pools", handleGetPoolsByName);
router.get("/:chainId/pools", handleGetPools);
router.get("/:chainId/pools/hero", handleGetHeroPools);
router.get("/:chainId/pools/:poolId", handleGetPoolsById);
router.get("/:chainId/adapters", handleGetAdapters);

router.get("/:chainId/oracles", handleGetOracles);

router.get("/eth", handleGetEthPrice);
router.get("/:chainId/:address/usd", handleGetUSDPrice);

router.get("/:chainId/fnfts/:address", handleGetFNFTs);

router.get("/points", handleGetPoints);

router.post("/redux", handleUpdateReduxStatistics);
router.get("/redux", handleGetReduxStatistics);
router.get("/redux/:address", handleGetIndividualStatistics);

router.get("/queue", handleGetEnqueuedEvents);
router.get("/queue-state", handleGetQueueState);

router.get("/tokens/:chainId", handleGetTokens);

export default router;
