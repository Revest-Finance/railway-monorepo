import { getReduxStatistics, updateReduxStatistics } from "./db.api";
import { getReduxTotalDeposited } from "./eth.api";

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

const cache: { value: ReduxStatisticsRequest | null } = { value: null };

interface UpdateController {
    data: ReduxStatisticsRequest | null;
    timer: ReturnType<typeof setTimeout> | null;
}

// used to delay the update to redux database to avoid spamming the database
const updateController: UpdateController = {
    data: null,
    timer: null,
};

export async function handleUpdateReduxStatistics(request: ReduxStatisticsRequest) {
    updateController.data = request;

    if (updateController.timer) {
        return;
    }

    updateController.timer = setTimeout(async () => {
        await updateReduxStatistics(updateController.data!);

        updateController.data = null;
        updateController.timer = null;
    }, 1000);
}

export async function handleGetReduxStatistics(): Promise<ReduxStatisticsRequest> {
    if (cache.value) {
        return cache.value;
    }

    const totalDeposited = await getReduxTotalDeposited();
    const dbStats = await getReduxStatistics();

    cache.value = { ...dbStats, totalDeposited };

    setTimeout(() => {
        cache.value = null;
    }, 5000 * 60);

    return cache.value;
}
