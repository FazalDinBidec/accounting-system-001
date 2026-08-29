import { Head, Link } from '@inertiajs/react';
import StockController from '@/actions/App/Http/Controllers/StockController';
import Heading from '@/components/heading';
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
import { dateInputValue, formatQty } from '@/pages/stock/types';
import type { StockMovementRow } from '@/pages/stock/types';

export default function StockShow({
    product,
    movements,
}: {
    product: { id: number; name: string };
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
                            <Link href={StockController.index.url()}>
                                Back
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {movements.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                No stock movements yet.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Number</TableHead>
                                        <TableHead>In</TableHead>
                                        <TableHead>Out</TableHead>
                                        <TableHead>Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                {dateInputValue(movement.date)}
                                            </TableCell>
                                            <TableCell>
                                                {movement.type}
                                            </TableCell>
                                            <TableCell>
                                                {movement.number}
                                            </TableCell>
                                            <TableCell>
                                                {formatQty(
                                                    movement.quantity_in,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatQty(
                                                    movement.quantity_out,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatQty(movement.balance)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
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
