import type { Paginated } from '@/components/pagination';

export type StockSummary = {
    id: number;
    name: string;
    purchased: string;
    sold: string;
    returned: string;
    on_hand: string;
};

export type StockMovementRow = {
    id: number;
    date: string;
    type: string;
    number: string;
    quantity_in: string;
    quantity_out: string;
    balance: string;
};

export type PaginatedStock = Paginated<StockSummary>;

export function toQtyNumber(value: string | number): number {
    const amount = Number(value);

    return Number.isFinite(amount) ? amount : 0;
}

export function formatQty(value: string | number): string {
    return toQtyNumber(value).toFixed(2);
}

export function dateInputValue(value: string): string {
    return value.slice(0, 10);
}
