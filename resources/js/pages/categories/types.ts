import type { Paginated } from '@/components/pagination';

export type CategoryStatus = 'active' | 'inactive';

export type CategoryParentOption = {
    id: number;
    name: string;
};

export type Category = {
    id: number;
    parent_id: number | null;
    name: string;
    status: CategoryStatus;
    parent?: CategoryParentOption | null;
};

export type PaginatedCategories = Paginated<Category>;
