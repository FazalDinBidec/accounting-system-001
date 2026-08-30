import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import VoucherController from '@/actions/App/Http/Controllers/VoucherController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    dateInputValue,
    formatMoney,
    voucherTypeLabel,
} from '@/pages/vouchers/types';
import type { PaginatedVouchers, Voucher } from '@/pages/vouchers/types';

export default function VouchersIndex({
    vouchers,
    filters,
}: {
    vouchers: PaginatedVouchers;
    filters: { type: string };
}) {
    const [deleteVoucher, setDeleteVoucher] = useState<Voucher | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openDelete(voucher: Voucher): void {
        setDeleteVoucher(voucher);
        setDeleteOpen(true);
    }

    function lineSummary(voucher: Voucher): string {
        if (!voucher.lines || voucher.lines.length === 0) {
            return '—';
        }

        return voucher.lines
            .map((line) => {
                const method = line.method === 'bank' ? 'Bank' : 'Cash';
                const account = line.account?.name ?? '—';

                return `${method}: ${account}`;
            })
            .join(', ');
    }

    return (
        <>
            <Head title="Vouchers" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-6">
                        <Heading title="Vouchers" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant={filters.type === '' ? 'default' : 'outline'}
                                asChild
                            >
                                <Link href={VoucherController.index.url()}>All</Link>
                            </Button>
                            <Button
                                variant={
                                    filters.type === 'receipt' ? 'default' : 'outline'
                                }
                                asChild
                            >
                                <Link
                                    href={VoucherController.index.url({
                                        query: { type: 'receipt' },
                                    })}
                                >
                                    Receipts
                                </Link>
                            </Button>
                            <Button
                                variant={
                                    filters.type === 'payment' ? 'default' : 'outline'
                                }
                                asChild
                            >
                                <Link
                                    href={VoucherController.index.url({
                                        query: { type: 'payment' },
                                    })}
                                >
                                    Payments
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={VoucherController.create.url()}>
                                    <Plus />
                                    Add voucher
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {vouchers.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                No vouchers yet.
                            </p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Party</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Accounts</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-center">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {vouchers.data.map((voucher) => (
                                            <TableRow key={voucher.id}>
                                                <TableCell>
                                                    {voucher.number}
                                                </TableCell>
                                                <TableCell>
                                                    {voucherTypeLabel(voucher.type)}
                                                </TableCell>
                                                <TableCell>
                                                    {voucher.party?.name ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {dateInputValue(voucher.date)}
                                                </TableCell>
                                                <TableCell>
                                                    {lineSummary(voucher)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(voucher.amount)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={VoucherController.edit.url(
                                                                    voucher,
                                                                )}
                                                            >
                                                                <Pencil />
                                                                <span className="sr-only">
                                                                    Edit
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openDelete(voucher)
                                                            }
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={vouchers.links}
                                    from={vouchers.from}
                                    to={vouchers.to}
                                    total={vouchers.total}
                                    lastPage={vouchers.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete voucher"
                description={
                    deleteVoucher
                        ? `Delete ${deleteVoucher.number}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteVoucher
                        ? VoucherController.destroy.form(deleteVoucher)
                        : undefined
                }
            />
        </>
    );
}

VouchersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Vouchers',
            href: VoucherController.index(),
        },
    ],
};
