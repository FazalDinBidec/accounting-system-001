import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SaleOrderController from '@/actions/App/Http/Controllers/SaleOrderController';
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
import { dateInputValue, formatMoney } from '@/pages/sales/types';
import type { PaginatedSales, SaleOrder } from '@/pages/sales/types';

export default function SalesIndex({ sales }: { sales: PaginatedSales }) {
    const [deleteSale, setDeleteSale] = useState<SaleOrder | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openDelete(sale: SaleOrder): void {
        setDeleteSale(sale);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Sales" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Sales" />
                        <Button asChild>
                            <Link href={SaleOrderController.create.url()}>
                                <Plus />
                                Add sale
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                    {sales.data.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            No sales yet.
                        </p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Number</TableHead>
                                        <TableHead>Party</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-center">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.data.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>
                                                {sale.number}
                                            </TableCell>
                                            <TableCell>
                                                {sale.party?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {dateInputValue(sale.date)}
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(sale.total_amount)}
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
                                                            href={SaleOrderController.edit.url(
                                                                sale,
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
                                                            openDelete(sale)
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
                                links={sales.links}
                                from={sales.from}
                                to={sales.to}
                                total={sales.total}
                                lastPage={sales.last_page}
                            />
                        </>
                    )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete sale"
                description={
                    deleteSale
                        ? `Delete ${deleteSale.number}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteSale
                        ? SaleOrderController.destroy.form(deleteSale)
                        : undefined
                }
            />
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: SaleOrderController.index(),
        },
    ],
};
