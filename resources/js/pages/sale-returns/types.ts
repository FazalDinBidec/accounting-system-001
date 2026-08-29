import type { Paginated } from '@/components/pagination';

export type SaleReturnParty = {
    id: number;
    name: string;
};

export type ReturnableSaleItem = {
    sale_order_item_id: number;
    product_id: number;
    product_name: string;
    sold_qty: string;
    returned_qty: string;
    remaining_qty: string;
    unit_price: string;
};

export type ReturnableSale = {
    id: number;
    number: string;
    date: string;
    party: SaleReturnParty | null;
    items: ReturnableSaleItem[];
};

export type SaleReturnItem = {
    id: number;
    sale_return_id: number;
    sale_order_item_id: number;
    product_id: number;
    quantity: string;
    unit_price: string;
    total_amount: string;
};

export type SaleReturn = {
    id: number;
    sale_id: number;
    number: string;
    date: string;
    sub_total: string;
    total_amount: string;
    notes: string | null;
    sale_order?: {
        id: number;
        number: string;
        party?: SaleReturnParty | null;
    } | null;
    items?: SaleReturnItem[];
};

export type PaginatedSaleReturns = Paginated<SaleReturn>;

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

export function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}
