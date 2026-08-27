import type { Paginated } from '@/components/pagination';

export type Party = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    is_active: boolean;
};

export type PaginatedParties = Paginated<Party>;
