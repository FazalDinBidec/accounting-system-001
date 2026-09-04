import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import OpeningController from '@/actions/App/Http/Controllers/OpeningController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney, openingTypeLabel } from '@/pages/openings/types';
import type { PaginatedOpenings, PartyOpening } from '@/pages/openings/types';

export default function OpeningsIndex({
    openings,
    filters,
}: {
    openings: PaginatedOpenings;
    filters: { type: string };
}) {
    const [deleteOpening, setDeleteOpening] = useState<PartyOpening | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        <>
            <Head title="Opening Balances" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-6">
                        <Heading title="Opening Balances" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant={filters.type === '' ? 'default' : 'outline'} asChild>
                                <Link href={OpeningController.index.url()}>All</Link>
                            </Button>
                            <Button variant={filters.type === 'receivable' ? 'default' : 'outline'} asChild>
                                <Link
                                    href={OpeningController.index.url({
                                        query: { type: 'receivable' },
                                    })}
                                >
                                    Receivable
                                </Link>
                            </Button>
                            <Button variant={filters.type === 'payable' ? 'default' : 'outline'} asChild>
                                <Link
                                    href={OpeningController.index.url({
                                        query: { type: 'payable' },
                                    })}
                                >
                                    Payable
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={OpeningController.create.url()}>
                                    <Plus />
                                    Add opening balance
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {openings.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No opening balances yet.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Party</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openings.data.map((opening) => (
                                            <TableRow key={opening.id}>
                                                <TableCell>{opening.number}</TableCell>
                                                <TableCell>{openingTypeLabel(opening.type)}</TableCell>
                                                <TableCell>{opening.party?.name ?? '—'}</TableCell>
                                                <TableCell>{dateInputValue(opening.date)}</TableCell>
                                                <TableCell>{formatMoney(opening.amount)}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={OpeningController.edit.url(opening)}>
                                                                <Pencil />
                                                                <span className="sr-only">Edit</span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() => {
                                                                setDeleteOpening(opening);
                                                                setDeleteOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={openings.links}
                                    from={openings.from}
                                    to={openings.to}
                                    total={openings.total}
                                    lastPage={openings.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete opening balance"
                description={
                    deleteOpening
                        ? `Delete ${deleteOpening.number}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={deleteOpening ? OpeningController.destroy.form(deleteOpening) : undefined}
            />
        </>
    );
}

OpeningsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Opening Balances',
            href: OpeningController.index(),
        },
    ],
};
