import { createSlice, current } from "@reduxjs/toolkit";
import { RootState } from '../../store';

const MAX_TRADES = 50; // Maximum number of trades to maintain in state

interface Trade {
    price: number;
    qty: number;
    side: 'buy' | 'sell';
    timestamp?: number;
}

export interface TradeHistoryState {
    trades: Trade[]    
}

const initialState: TradeHistoryState = {
    trades: []
}

export const tradeHistorySlice = createSlice({
    name: 'tradehistory',
    initialState,
    reducers: {
        addTrades: (state, { payload }) => {
            // Ensure payload is an array
            const newTrades = Array.isArray(payload) ? payload : [payload];
            
            // Add timestamp to trades if not present
            const tradesWithTimestamp = newTrades.map(trade => ({
                ...trade,
                timestamp: trade.timestamp || Date.now()
            }));

            // Combine new trades with existing trades
            const allTrades = [...tradesWithTimestamp, ...state.trades]
                // Remove duplicates based on timestamp and price
                .filter((trade, index, self) => 
                    index === self.findIndex(t => 
                        t.timestamp === trade.timestamp && 
                        t.price === trade.price &&
                        t.qty === trade.qty &&
                        t.side === trade.side
                    )
                )
                // Sort by timestamp, most recent first
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                // Limit to MAX_TRADES
                .slice(0, MAX_TRADES);

            // Update state
            state.trades = allTrades;
            
            // Log current state for debugging
            // console.log('Current trades in state:', current(state).trades.length);
        },
        clearTrades: (state) => {
            state.trades = [];
        },
        // Add action to handle product switch
        resetTrades: (state) => {
            state.trades = [];
        }
    }
});

export const { addTrades, clearTrades, resetTrades } = tradeHistorySlice.actions;

// Selectors
export const selectTrades = (state: RootState): Trade[] => state.tradehistory.trades;
export const selectTradeCount = (state: RootState): number => state.tradehistory.trades.length;

export default tradeHistorySlice.reducer;