export interface FNFTCreation {
    id: string;
    poolId: string;
    fnftId: number;
    isPrincipal: boolean;
    quantityFNFTs: number;
    blockTimestamp: number;
    transactionHash: string;
}
export interface FNFTRedeemed {
    id: string;
    poolId: string;
    fnftId: number;
    isPrincipal: boolean;
    quantityFNFTs: number;
    blockTimestamp: number;
    transactionHash: string;
}

export interface ClientEvent {
    chainId: number;
    tx: string;
    enqueuing: boolean;
    isProducer: boolean;
    poolId: string;
    address: string;
    position: BigInt;
    packetsRemaining: BigInt;
    depositedShares: BigInt;
    shouldFarm: boolean | undefined;
    owner: string;
    ts: number;
}
export interface QueueState {
    isProducer: boolean;
    events: ClientEvent[];
    totalQueuedPackets: BigInt;
    adjustedQueuedTokens: BigInt;
    totalUsd: number;
}

export interface Transfer {
    id: string;
    fromAddress: string;
    toAddress: string;
    amount: number;
    blockTimestamp: string;
    blockNumber: number;
    txHash: string;
}

export interface ProcessingEvent {
    id: string;
    totalAssets: number;
    ratio: number;
    blockNumber: number;
    blockTimestamp: string;
    txHash: string;
}

export interface ReduxRequest {
    id: string;
    processingEventId: string;
    type: "DepositRequestProcessed" | "RedeemRequestProcessed";
    userAddress: string;
    shares: number;
    assets: number;
}

export interface UserShare {
    userAddress: string;
    blockTimestamp: string;
    ratio: number;
    assetsTotal: number;
    sharesTotal: number;
}

export interface UserProfit {
    totalAssetProfit: number;
    totalShares: number;
    assetValue: number;
}

export interface ReduxPerformanceEntry {
    timestamp: string;
    netProfit: number;
    buyAndHoldReturn: number;
    avgWinningTrade: number;
    avgLosingTrade: number;
    largestWinningTrade: number;
    largestLosingTrade: number;
}

export interface ReduxStatisticsRequest {
    currentBalance: number;
    totalDeposited: number;
    usd: ReduxPerformanceEntry;
    percentage: ReduxPerformanceEntry;
}
