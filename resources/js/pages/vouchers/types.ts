import type { Paginated } from '@/components/pagination';

export type VoucherOption = {
    id: number;
    name: string;
};

export type VoucherLine = {
    id?: number;
    method: 'cash' | 'bank';
    account_id: number;
    amount: string;
    bank_name: string | null;
    account_no: string | null;
    holder_name: string | null;
    instrument_no: string | null;
    account?: VoucherOption | null;
};

export type Voucher = {
    id: number;
    type: 'receipt' | 'payment';
    number: string;
    date: string;
    party_id: number;
    amount: string;
    notes: string | null;
    party?: VoucherOption | null;
    lines?: VoucherLine[];
};

export type PaginatedVouchers = Paginated<Voucher>;

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

export function voucherTypeLabel(type: string): string {
    return type === 'payment' ? 'Payment' : 'Receipt';
}
