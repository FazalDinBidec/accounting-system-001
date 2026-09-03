import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import SaleReturnController from '@/actions/App/Http/Controllers/SaleReturnController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney } from '@/pages/sale-returns/types';
import type { PaginatedSaleReturns, SaleReturn } from '@/pages/sale-returns/types';

export default function SaleReturnsIndex({ saleReturns }: { saleReturns: PaginatedSaleReturns }) {
    const [deleteReturn, setDeleteReturn] = useState<SaleReturn | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openDelete(saleReturn: SaleReturn): void {
        setDeleteReturn(saleReturn);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Sale Returns" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Sale Returns" />
                        <Button asChild>
                            <Link href={SaleReturnController.create.url()}>
                                <Plus />
                                Add sale return
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {saleReturns.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No sale returns yet.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Sale</TableHead>
                                            <TableHead>Party</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {saleReturns.data.map((saleReturn) => (
                                            <TableRow key={saleReturn.id}>
                                                <TableCell>{saleReturn.number}</TableCell>
                                                <TableCell>{saleReturn.sale_order?.number ?? '—'}</TableCell>
                                                <TableCell>{saleReturn.sale_order?.party?.name ?? '—'}</TableCell>
                                                <TableCell>{dateInputValue(saleReturn.date)}</TableCell>
                                                <TableCell>{formatMoney(saleReturn.total_amount)}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={SaleReturnController.edit.url(saleReturn)}>
                                                                <Pencil />
                                                                <span className="sr-only">Edit</span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() => openDelete(saleReturn)}
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
                                    links={saleReturns.links}
                                    from={saleReturns.from}
                                    to={saleReturns.to}
                                    total={saleReturns.total}
                                    lastPage={saleReturns.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete sale return"
                description={
                    deleteReturn ? `Delete ${deleteReturn.number}? This cannot be undone.` : 'This cannot be undone.'
                }
                action={deleteReturn ? SaleReturnController.destroy.form(deleteReturn) : undefined}
            />
        </>
    );
}

SaleReturnsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Sale Returns',
            href: SaleReturnController.index(),
        },
    ],
};
