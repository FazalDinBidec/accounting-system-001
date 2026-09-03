import { Head, Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import StockController from '@/actions/App/Http/Controllers/StockController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatQty, type StockBatchRow, type StockMovementRow } from '@/pages/stock/types';

export default function StockShow({
    product,
    batches,
    movements,
}: {
    product: { id: number; name: string };
    batches: StockBatchRow[];
    movements: StockMovementRow[];
}) {
    return (
        <>
            <Head title={`${product.name} stock`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title={product.name} />
                        <Button variant="outline" asChild>
                            <Link href={StockController.index.url()}>Back</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-8 py-6">
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold">Batch-wise stock</h3>
                            {batches.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No batches on hand.</p>
                            ) : (
                                <div className="space-y-3">
                                    {batches.map((batch) => (
                                        <Collapsible key={batch.id} className="rounded border">
                                            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-muted/50">
                                                <div className="grid flex-1 gap-1 md:grid-cols-3">
                                                    <span className="font-medium">{batch.batch_no}</span>
                                                    <span>On hand: {formatQty(batch.quantity_on_hand)}</span>
                                                    <span className="text-sm text-muted-foreground">
                                                        First purchased: {dateInputValue(batch.purchased_at)}
                                                    </span>
                                                </div>
                                                <ChevronDown className="size-4 shrink-0" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="border-t px-4 py-3">
                                                <p className="mb-2 text-sm font-medium">Purchase history</p>
                                                {batch.purchase_history.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        No purchase history.
                                                    </p>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>PO</TableHead>
                                                                <TableHead>Party</TableHead>
                                                                <TableHead>Date</TableHead>
                                                                <TableHead>Qty</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {batch.purchase_history.map((purchase) => (
                                                                <TableRow key={purchase.purchase_order_id}>
                                                                    <TableCell>{purchase.number}</TableCell>
                                                                    <TableCell>{purchase.party_name}</TableCell>
                                                                    <TableCell>
                                                                        {dateInputValue(purchase.date)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {formatQty(purchase.quantity)}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-base font-semibold">Movement history</h3>
                            {movements.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No stock movements yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Batch</TableHead>
                                            <TableHead>In</TableHead>
                                            <TableHead>Out</TableHead>
                                            <TableHead>Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {movements.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell>{dateInputValue(movement.date)}</TableCell>
                                                <TableCell>{movement.type}</TableCell>
                                                <TableCell>{movement.number}</TableCell>
                                                <TableCell>{movement.batch_no ?? '—'}</TableCell>
                                                <TableCell>{formatQty(movement.quantity_in)}</TableCell>
                                                <TableCell>{formatQty(movement.quantity_out)}</TableCell>
                                                <TableCell>{formatQty(movement.balance)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StockShow.layout = {
    breadcrumbs: [
        {
            title: 'Stock',
            href: StockController.index(),
        },
        {
            title: 'History',
            href: StockController.index(),
        },
    ],
};
