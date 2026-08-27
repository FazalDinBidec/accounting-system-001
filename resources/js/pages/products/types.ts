import type { Paginated } from '@/components/pagination';

export type Product = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
};

export type PaginatedProducts = Paginated<Product>;
