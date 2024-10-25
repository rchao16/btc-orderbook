import React, { CSSProperties } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface Trade {
    price: number;
    qty: number;
    side: 'buy' | 'sell';
    timestamp?: number;
}

interface TradeRowProps {
    trade: Trade;
}

interface StylesObject {
    [key: string]: CSSProperties;
}

const styles: StylesObject = {
    tradeRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        padding: '8px 0',
        borderBottom: '1px solid #333',
        fontSize: '14px'
    },
    price: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    quantity: {
        textAlign: 'right',
        color: '#ddd'
    },
    sideContainer: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    sideBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
    },
    buyBadge: {
        backgroundColor: '#143321',
        color: '#4ade80'
    },
    sellBadge: {
        backgroundColor: '#331419',
        color: '#f87171'
    }
}

const TradeRow: React.FC<TradeRowProps> = ({ trade }) => {
    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(num);
    };

    const getTradeStyles = (side: 'buy' | 'sell'): React.CSSProperties => ({
        ...styles.price,
        color: side === 'buy' ? '#4ade80' : '#f87171'
    });

    const getBadgeStyles = (side: 'buy' | 'sell'): React.CSSProperties => ({
        ...styles.sideBadge,
        ...(side === 'buy' ? styles.buyBadge : styles.sellBadge)
    });

    return (
        <div style={styles.tradeRow}>
            <div style={getTradeStyles(trade.side)}>
                {trade.side === 'buy' ?
                    <ArrowUpIcon size={16} /> :
                    <ArrowDownIcon size={16} />
                }
                {formatNumber(trade.price)}
            </div>
            <div style={styles.quantity}>
                {formatNumber(trade.qty)}
            </div>
            <div style={styles.sideContainer}>
                <span style={getBadgeStyles(trade.side)}>
                    {trade.side.toUpperCase()}
                </span>
            </div>
        </div>
    );
};

export default TradeRow;