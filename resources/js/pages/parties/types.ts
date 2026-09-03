import type { Paginated } from '@/components/pagination';

export type Party = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
    is_partner: boolean;
    capital_balance?: string | null;
};

export type PaginatedParties = Paginated<Party>;
