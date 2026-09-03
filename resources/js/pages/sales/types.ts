import type { Paginated } from '@/components/pagination';

export type SaleOption = {
    id: number;
    name: string;
    on_hand: string;
};

export type SaleBatchAllocation = {
    product_batch_id: number;
    batch_no: string;
    quantity: string;
};

export type SaleOrderItem = {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: string;
    unit_price: string;
    total_amount: string;
    batches?: SaleBatchAllocation[];
};

export type SaleOrder = {
    id: number;
    party_id: number;
    number: string;
    date: string;
    sub_total: string;
    other_charges: string;
    total_amount: string;
    notes: string | null;
    party?: SaleOption | null;
    items?: SaleOrderItem[];
};

export type PaginatedSales = Paginated<SaleOrder>;

export type AvailableBatch = {
    product_batch_id: number;
    batch_no: string;
    quantity_on_hand: string;
};

export function toMoneyNumber(value: string | number): number {
    const amount = Number(value);

    return Number.isFinite(amount) ? amount : 0;
}

export function formatMoney(value: string | number): string {
    return toMoneyNumber(value).toFixed(2);
}

export function dateInputValue(value: string): string {
    return value.slice(0, 10);
}

export function formatQty(value: string | number): string {
    const amount = Number(value);

    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}
