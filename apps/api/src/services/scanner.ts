import {
    fetchWalletTransfers,
    parseTransferLog,
    getTokenMetadata,
    getTokenBalance,
    provider,
} from './blockchain';
import { getTokenPrice, getHistoricalPrice, isLikelyRugPull } from './price';

/**
 * Sin types
 */
export enum SinType {
    RUG_PULL = 'rug_pull',
    PAPER_HANDS = 'paper_hands',
    TOP_BUYER = 'top_buyer',
    FOMO_DEGEN = 'fomo_degen',
}

/**
 * Sin severity levels
 */
export enum SinSeverity {
    MINOR = 'minor', // Loss < $100
    MORTAL = 'mortal', // Loss $100 - $1000
    CARDINAL = 'cardinal', // Loss > $1000
    UNFORGIVABLE = 'unforgivable', // Multiple rugs
}

/**
 * Identified sin structure
 */
export interface Sin {
    wallet_address: string;
    sin_type: SinType;
    severity: SinSeverity;
    token_address: string;
    token_symbol: string;
    buy_amount?: number;
    sell_amount?: number;
    loss_amount_usd: number;
    buy_timestamp?: Date;
    sell_timestamp?: Date;
    transaction_hash?: string;
}

/**
 * Trading pair representing a buy and sell of the same token
 */
interface TradingPair {
    tokenAddress: string;
    tokenSymbol: string;
    buyAmount: bigint;
    sellAmount: bigint;
    buyTimestamp: number;
    sellTimestamp: number;
    buyPrice: number;
    sellPrice: number;
    buyTxHash: string;
    sellTxHash: string;
}

/**
 * Main wallet scanner - analyzes trading history and identifies sins
 */
export async function scanWallet(walletAddress: string): Promise<{
    sins: Sin[];
    primarySin: SinType;
    totalLoss: number;
}> {
    console.log(`🔍 Scanning wallet ${walletAddress} for sins...`);

    try {
        // Step 1: Fetch all transfers
        const { buys, sells } = await fetchWalletTransfers(walletAddress);

        console.log(`Found ${buys.length} buys and ${sells.length} sells`);

        // Step 2: Parse and organize transfers by token
        const tokenMap = new Map<string, { buys: any[]; sells: any[] }>();

        for (const buyLog of buys) {
            const transfer = parseTransferLog(buyLog);
            const tokenAddr = transfer.tokenAddress.toLowerCase();

            if (!tokenMap.has(tokenAddr)) {
                tokenMap.set(tokenAddr, { buys: [], sells: [] });
            }
            tokenMap.get(tokenAddr)!.buys.push(transfer);
        }

        for (const sellLog of sells) {
            const transfer = parseTransferLog(sellLog);
            const tokenAddr = transfer.tokenAddress.toLowerCase();

            if (!tokenMap.has(tokenAddr)) {
                tokenMap.set(tokenAddr, { buys: [], sells: [] });
            }
            tokenMap.get(tokenAddr)!.sells.push(transfer);
        }

        // Step 3: Identify sins
        const sins: Sin[] = [];
        let rugCount = 0;

        for (const [tokenAddress, transfers] of tokenMap.entries()) {
            const { buys, sells } = transfers;

            // Get token metadata
            const metadata = await getTokenMetadata(tokenAddress);
            const currentPrice = await getTokenPrice(tokenAddress);

            // Check for rug pull
            const isRug = await isLikelyRugPull(tokenAddress);
            if (isRug && buys.length > 0) {
                const totalBuyAmount = buys.reduce((sum, t) => sum + Number(t.amount), 0);
                const buyPrice = await getHistoricalPrice(tokenAddress, buys[0].blockNumber);
                const lossUsd = (totalBuyAmount / 10 ** metadata.decimals) * buyPrice;

                sins.push({
                    wallet_address: walletAddress,
                    sin_type: SinType.RUG_PULL,
                    severity: getSeverity(lossUsd, true),
                    token_address: tokenAddress,
                    token_symbol: metadata.symbol,
                    buy_amount: totalBuyAmount,
                    loss_amount_usd: lossUsd,
                    buy_timestamp: new Date(buys[0].blockNumber * 12000), // Approximate
                    transaction_hash: buys[0].transactionHash,
                });

                rugCount++;
                continue;
            }

            // Check for paper hands (sold within 24h at a loss)
            for (const buy of buys) {
                const matchingSells = sells.filter(
                    (sell) => sell.blockNumber > buy.blockNumber
                );

                for (const sell of matchingSells) {
                    const buyBlock = await provider.getBlock(buy.blockNumber);
                    const sellBlock = await provider.getBlock(sell.blockNumber);

                    if (!buyBlock || !sellBlock) continue;

                    const timeDiff = sellBlock.timestamp - buyBlock.timestamp;
                    const is24h = timeDiff < 24 * 60 * 60;

                    if (is24h) {
                        const buyPrice = await getHistoricalPrice(tokenAddress, buyBlock.timestamp);
                        const sellPrice = await getHistoricalPrice(tokenAddress, sellBlock.timestamp);

                        const buyValue = (Number(buy.amount) / 10 ** metadata.decimals) * buyPrice;
                        const sellValue = (Number(sell.amount) / 10 ** metadata.decimals) * sellPrice;
                        const loss = buyValue - sellValue;

                        if (loss > 0) {
                            sins.push({
                                wallet_address: walletAddress,
                                sin_type: SinType.PAPER_HANDS,
                                severity: getSeverity(loss),
                                token_address: tokenAddress,
                                token_symbol: metadata.symbol,
                                buy_amount: Number(buy.amount),
                                sell_amount: Number(sell.amount),
                                loss_amount_usd: loss,
                                buy_timestamp: new Date(buyBlock.timestamp * 1000),
                                sell_timestamp: new Date(sellBlock.timestamp * 1000),
                                transaction_hash: sell.transactionHash,
                            });
                        }
                    }
                }
            }

            // Check for top buying (bought near all-time high)
            // This is simplified - would need historical high data
            // For MVP, check if current price is way lower than buy price
            for (const buy of buys) {
                const buyBlock = await provider.getBlock(buy.blockNumber);
                if (!buyBlock) continue;

                const buyPrice = await getHistoricalPrice(tokenAddress, buyBlock.timestamp);

                // If they bought and current price is < 20% of buy price, they FOMOd at top
                if (currentPrice > 0 && currentPrice < buyPrice * 0.2) {
                    const buyValue = (Number(buy.amount) / 10 ** metadata.decimals) * buyPrice;
                    const currentValue = (Number(buy.amount) / 10 ** metadata.decimals) * currentPrice;
                    const loss = buyValue - currentValue;

                    sins.push({
                        wallet_address: walletAddress,
                        sin_type: SinType.TOP_BUYER,
                        severity: getSeverity(loss),
                        token_address: tokenAddress,
                        token_symbol: metadata.symbol,
                        buy_amount: Number(buy.amount),
                        loss_amount_usd: loss,
                        buy_timestamp: new Date(buyBlock.timestamp * 1000),
                        transaction_hash: buy.transactionHash,
                    });
                }
            }
        }

        // Calculate total loss and primary sin
        const totalLoss = sins.reduce((sum, sin) => sum + sin.loss_amount_usd, 0);
        const primarySin = determinePrimarySin(sins);

        console.log(`✅ Scan complete. Found ${sins.length} sins, total loss: $${totalLoss.toFixed(2)}`);

        return {
            sins,
            primarySin,
            totalLoss,
        };
    } catch (error) {
        console.error('Error scanning wallet:', error);
        throw error;
    }
}

/**
 * Determine sin severity based on loss amount
 */
function getSeverity(lossUsd: number, isRug: boolean = false): SinSeverity {
    if (isRug) {
        return SinSeverity.UNFORGIVABLE;
    }

    if (lossUsd < 100) return SinSeverity.MINOR;
    if (lossUsd < 1000) return SinSeverity.MORTAL;
    return SinSeverity.CARDINAL;
}

/**
 * Determine the primary sin type for a wallet
 */
function determinePrimarySin(sins: Sin[]): SinType {
    if (sins.length === 0) return SinType.FOMO_DEGEN;

    // Count each sin type
    const counts = {
        [SinType.RUG_PULL]: 0,
        [SinType.PAPER_HANDS]: 0,
        [SinType.TOP_BUYER]: 0,
        [SinType.FOMO_DEGEN]: 0,
    };

    sins.forEach((sin) => {
        counts[sin.sin_type]++;
    });

    // Prioritize: Rug > Paper Hands > Top Buyer > FOMO
    if (counts[SinType.RUG_PULL] > 0) return SinType.RUG_PULL;
    if (counts[SinType.PAPER_HANDS] > 2) return SinType.PAPER_HANDS;
    if (counts[SinType.TOP_BUYER] > 2) return SinType.TOP_BUYER;

    return SinType.FOMO_DEGEN;
}
