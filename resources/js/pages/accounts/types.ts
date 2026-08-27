import type { Paginated } from '@/components/pagination';

export type AccountType =
    | 'asset'
    | 'liability'
    | 'equity'
    | 'income'
    | 'expense';

export type AccountParentOption = {
    id: number;
    name: string;
};

export type Account = {
    id: number;
    name: string;
    type: AccountType;
    parent_id: number | null;
    is_active: boolean;
    parent?: AccountParentOption | null;
};

export type PaginatedAccounts = Paginated<Account>;

export const accountTypeLabels: Record<AccountType, string> = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    income: 'Income',
    expense: 'Expense',
};
