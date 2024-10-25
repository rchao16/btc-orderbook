import React, { FunctionComponent, useEffect, CSSProperties, useCallback, useRef } from 'react';
import useWebSocket from 'react-use-websocket';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addTrades, selectTrades, resetTrades } from './tradeHistorySlice';
import TradeRow from './TradeRow';
// Type definitions
interface TradeHistoryProps {
    windowWidth: number;
    productId: string;
    isFeedKilled: boolean;
}

interface Trade {
    price: number;
    qty: number;
    side: 'buy' | 'sell';
    timestamp?: number; // Adding timestamp for sorting
}

interface TradeSnapshot {
    trades: Trade[];
    feed?: string;
    product_id?: string;
}

interface StylesObject {
    [key: string]: CSSProperties;
}

const MAX_TRADES = 50; // Maximum number of trades to show

// Styles remain the same...
const styles: StylesObject = {
    container: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '16px',
        maxHeight: '400px',
        overflowY: 'auto',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    title: {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: 0
    },
    productId: {
        fontSize: '14px',
        color: '#888'
    },
    columnHeaders: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#888'
    },
    tradesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    sideContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    emptyState: {
        textAlign: 'center',
        padding: '32px 0',
        color: '#666'
    }
};

const WSS_FEED_URL = 'wss://www.cryptofacilities.com/ws/v1';

const TradeHistory: FunctionComponent<TradeHistoryProps> = ({ windowWidth, productId, isFeedKilled }) => {
    const trades = useAppSelector(selectTrades);
    const dispatch = useAppDispatch();
    const currentProductRef = useRef(productId);

    const { sendJsonMessage, getWebSocket } = useWebSocket(WSS_FEED_URL, {
        onOpen: () => {
            console.log('WebSocket connection opened.');
            // Subscribe to the current product when connection opens
            subscribeToProduct(currentProductRef.current);
        },
        onClose: () => console.log('WebSocket connection closed.'),
        shouldReconnect: (closeEvent) => !isFeedKilled,
        onMessage: (event: WebSocketEventMap['message']) => processMessages(event),
        // Add reconnect interval to prevent rapid reconnection attempts
        reconnectInterval: 3000,
        // Add retry limit
        reconnectAttempts: 5
    });

    const subscribeToProduct = useCallback((product: string) => {
        const ws = getWebSocket();
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        // First unsubscribe from any existing subscription
        if (currentProductRef.current && currentProductRef.current !== product) {
            const unSubscribeMessage = {
                event: 'unsubscribe',
                feed: 'trade',
                product_ids: [currentProductRef.current]
            };
            sendJsonMessage(unSubscribeMessage);
        }

        // Then subscribe to the new product
        const subscribeMessage = {
            event: 'subscribe',
            feed: 'trade',
            product_ids: [product]
        };
        sendJsonMessage(subscribeMessage);
        currentProductRef.current = product;
    }, [sendJsonMessage, getWebSocket]);

    const processMessages = (event: { data: string})  => {
        try {
            const response: TradeSnapshot = JSON.parse(event.data);

            // process initial trade snapshot
            if (response.feed === 'trade_snapshot' && response?.trades?.length > 0) {
                const newTrades = response.trades.map(trade => ({
                    ...trade,
                    timestamp: Date.now()
                })).reverse();
    
                // Combine existing trades with new trades and limit the total
                const updatedTrades = [...newTrades, ...trades]
                    .slice(0, MAX_TRADES); // Keep only the most recent trades
    
                dispatch(addTrades(updatedTrades));
            }

            // Only process trade messages
            if (response.feed === 'trade') {
                // Ensure trades are for the current product
                if (response.product_id === currentProductRef.current) {
                    const newTrade = [{ ...response, timestamp: Date.now() }]
                    // Combine existing trades with new trades and limit the total
                    const updatedTrades = [ ...newTrade, ...trades]
                        .slice(0, MAX_TRADES); // Keep only the most recent trades
                    dispatch(addTrades(updatedTrades));
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    // Handle product changes
    useEffect(() => {
        if (productId !== currentProductRef.current) {
            dispatch(resetTrades());
            subscribeToProduct(productId);
        }
    }, [productId, subscribeToProduct, dispatch]);

    // Handle feed kill switch
    useEffect(() => {
        const ws = getWebSocket();
        if (isFeedKilled && ws) {
            ws.close();
        }
    }, [isFeedKilled, getWebSocket]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Recent Trades</h2>
                <div style={styles.productId}>{productId}</div>
            </div>
            
            <div style={styles.columnHeaders}>
                <div>Price</div>
                <div style={{ textAlign: 'right' }}>Size</div>
                <div style={{ textAlign: 'right' }}>Side</div>
            </div>

            <div style={styles.tradesList}>
                {trades.length === 0 ? (
                    <div style={styles.emptyState}>
                        No trades yet
                    </div>
                ) : (
                    trades.map((trade, index) => (
                        <TradeRow
                            key={`${trade.timestamp}-${index}`}
                            trade={trade}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default TradeHistory;