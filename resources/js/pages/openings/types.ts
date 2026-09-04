import type { Paginated } from '@/components/pagination';

export type OpeningOption = {
    id: number;
    name: string;
};

export type PartyOpening = {
    id: number;
    type: 'receivable' | 'payable';
    number: string;
    date: string;
    party_id: number;
    amount: string;
    notes: string | null;
    party?: OpeningOption | null;
};

export type PaginatedOpenings = Paginated<PartyOpening>;

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

export function openingTypeLabel(type: string): string {
    return type === 'payable' ? 'Payable' : 'Receivable';
}
