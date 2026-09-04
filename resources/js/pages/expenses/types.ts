import type { Paginated } from '@/components/pagination';

export type ExpenseOption = {
    id: number;
    name: string;
};

export type ExpenseLine = {
    id?: number;
    account_id: number;
    amount: string;
    narration: string | null;
    account?: ExpenseOption | null;
};

export type ExpensePaymentLine = {
    id?: number;
    method: 'cash' | 'bank';
    account_id: number;
    amount: string;
    bank_name: string | null;
    account_no: string | null;
    holder_name: string | null;
    instrument_no: string | null;
    account?: ExpenseOption | null;
};

export type Expense = {
    id: number;
    number: string;
    date: string;
    amount: string;
    notes: string | null;
    expenseLines?: ExpenseLine[];
    paymentLines?: ExpensePaymentLine[];
};

export type PaginatedExpenses = Paginated<Expense>;

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
