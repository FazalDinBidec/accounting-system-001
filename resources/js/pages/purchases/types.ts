import type { Paginated } from '@/components/pagination';

export type PurchaseOption = {
    id: number;
    name: string;
    on_hand: string;
};

export type PurchaseOrderItem = {
    id: number;
    purchase_id: number;
    product_id: number;
    quantity: string;
    unit_price: string;
    total_amount: string;
};

export type PurchaseOrder = {
    id: number;
    party_id: number;
    number: string;
    date: string;
    sub_total: string;
    other_charges: string;
    total_amount: string;
    notes: string | null;
    party?: PurchaseOption | null;
    items?: PurchaseOrderItem[];
};

export type PaginatedPurchases = Paginated<PurchaseOrder>;

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
