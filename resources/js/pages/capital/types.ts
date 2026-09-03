import type { Paginated } from '@/components/pagination';

export type CapitalOption = {
    id: number;
    name: string;
};

export type CapitalLine = {
    id?: number;
    method: 'cash' | 'bank';
    account_id: number;
    amount: string;
    bank_name: string | null;
    account_no: string | null;
    holder_name: string | null;
    instrument_no: string | null;
    account?: CapitalOption | null;
};

export type CapitalTransaction = {
    id: number;
    type: 'introduction' | 'withdrawal';
    number: string;
    date: string;
    party_id: number;
    amount: string;
    notes: string | null;
    party?: CapitalOption | null;
    lines?: CapitalLine[];
};

export type PaginatedCapitalTransactions = Paginated<CapitalTransaction>;

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

export function capitalTypeLabel(type: string): string {
    return type === 'withdrawal' ? 'Payout' : 'Introduction';
}
