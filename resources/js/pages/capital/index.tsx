import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CapitalController from '@/actions/App/Http/Controllers/CapitalController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { capitalTypeLabel, dateInputValue, formatMoney } from '@/pages/capital/types';
import type { CapitalTransaction, PaginatedCapitalTransactions } from '@/pages/capital/types';

export default function CapitalIndex({
    transactions,
    filters,
}: {
    transactions: PaginatedCapitalTransactions;
    filters: { type: string };
}) {
    const [deleteTransaction, setDeleteTransaction] = useState<CapitalTransaction | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function lineSummary(transaction: CapitalTransaction): string {
        if (!transaction.lines || transaction.lines.length === 0) {
            return '—';
        }

        return transaction.lines
            .map((line) => {
                const method = line.method === 'bank' ? 'Bank' : 'Cash';
                const account = line.account?.name ?? '—';

                return `${method}: ${account}`;
            })
            .join(', ');
    }

    return (
        <>
            <Head title="Capital Tranx" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-6">
                        <Heading title="Capital Tranx" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant={filters.type === '' ? 'default' : 'outline'} asChild>
                                <Link href={CapitalController.index.url()}>All</Link>
                            </Button>
                            <Button variant={filters.type === 'introduction' ? 'default' : 'outline'} asChild>
                                <Link
                                    href={CapitalController.index.url({
                                        query: { type: 'introduction' },
                                    })}
                                >
                                    Introductions
                                </Link>
                            </Button>
                            <Button variant={filters.type === 'withdrawal' ? 'default' : 'outline'} asChild>
                                <Link
                                    href={CapitalController.index.url({
                                        query: { type: 'withdrawal' },
                                    })}
                                >
                                    Payouts
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={CapitalController.create.url()}>
                                    <Plus />
                                    Add transaction
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {transactions.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No capital transactions yet.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Partner</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Accounts</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.data.map((transaction) => (
                                            <TableRow key={transaction.id}>
                                                <TableCell>{transaction.number}</TableCell>
                                                <TableCell>{capitalTypeLabel(transaction.type)}</TableCell>
                                                <TableCell>{transaction.party?.name ?? '—'}</TableCell>
                                                <TableCell>{dateInputValue(transaction.date)}</TableCell>
                                                <TableCell>{lineSummary(transaction)}</TableCell>
                                                <TableCell>{formatMoney(transaction.amount)}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={CapitalController.edit.url(transaction)}>
                                                                <Pencil />
                                                                <span className="sr-only">Edit</span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() => {
                                                                setDeleteTransaction(transaction);
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
                                    links={transactions.links}
                                    from={transactions.from}
                                    to={transactions.to}
                                    total={transactions.total}
                                    lastPage={transactions.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete capital transaction"
                description={
                    deleteTransaction
                        ? `Delete ${deleteTransaction.number}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={deleteTransaction ? CapitalController.destroy.form(deleteTransaction) : undefined}
            />
        </>
    );
}

CapitalIndex.layout = {
    breadcrumbs: [
        {
            title: 'Capital Tranx',
            href: CapitalController.index(),
        },
    ],
};
