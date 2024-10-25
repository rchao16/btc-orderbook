import { configureStore } from '@reduxjs/toolkit';
import orderbookReducer from './components/OrderBook/orderbookSlice';
import tradeHistoryReducer from './components/TradeHistory/tradeHistorySlice'

export const store = configureStore({
  reducer: {
    orderbook: orderbookReducer,
    tradehistory: tradeHistoryReducer
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
