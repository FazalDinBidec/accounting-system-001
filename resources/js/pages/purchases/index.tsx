import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
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
} from '@/pages/purchases/types';
import type {
    PaginatedPurchases,
    PurchaseOrder,
} from '@/pages/purchases/types';

export default function PurchasesIndex({
    purchases,
}: {
    purchases: PaginatedPurchases;
}) {
    const [deletePurchase, setDeletePurchase] = useState<PurchaseOrder | null>(
        null,
    );
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openDelete(purchase: PurchaseOrder): void {
        setDeletePurchase(purchase);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Purchases" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Purchases" />
                        <Button asChild>
                            <Link href={PurchaseOrderController.create.url()}>
                                <Plus />
                                Add purchase
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                    {purchases.data.length === 0 ? (
                        <p className="px-4 pb-6 text-center text-sm text-muted-foreground">
                            No purchases yet.
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
                                    {purchases.data.map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>
                                                {purchase.number}
                                            </TableCell>
                                            <TableCell>
                                                {purchase.party?.name ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                {dateInputValue(purchase.date)}
                                            </TableCell>
                                            <TableCell>
                                                {formatMoney(
                                                    purchase.total_amount,
                                                )}
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
                                                            href={PurchaseOrderController.edit.url(
                                                                purchase,
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
                                                            openDelete(purchase)
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
                                links={purchases.links}
                                from={purchases.from}
                                to={purchases.to}
                                total={purchases.total}
                                lastPage={purchases.last_page}
                            />
                        </>
                    )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete purchase"
                description={
                    deletePurchase
                        ? `Delete ${deletePurchase.number}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deletePurchase
                        ? PurchaseOrderController.destroy.form(deletePurchase)
                        : undefined
                }
            />
        </>
    );
}

PurchasesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: PurchaseOrderController.index(),
        },
    ],
};
