import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
};

function decodeLabel(label: string): string {
    return label
        .replaceAll('&laquo;', '«')
        .replaceAll('&raquo;', '»')
        .replaceAll('&amp;', '&')
        .replaceAll('&nbsp;', ' ');
}

export default function Pagination({
    links,
    from,
    to,
    total,
    lastPage,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    lastPage: number;
}) {
    if (total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Showing {from} to {to} of {total}
            </p>

            {lastPage > 1 && (
                <nav
                    aria-label="Pagination"
                    className="flex flex-wrap items-center gap-1"
                >
                    {links.map((link, index) =>
                        link.url && !link.active ? (
                            <Button
                                key={`${link.label}-${index}`}
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <Link href={link.url} preserveScroll>
                                    {decodeLabel(link.label)}
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                key={`${link.label}-${index}`}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled
                            >
                                {decodeLabel(link.label)}
                            </Button>
                        ),
                    )}
                </nav>
            )}
        </div>
    );
}
