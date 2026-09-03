import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import StockController from '@/actions/App/Http/Controllers/StockController';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatQty } from '@/pages/stock/types';
import type { PaginatedStock } from '@/pages/stock/types';

export default function StockIndex({ products }: { products: PaginatedStock }) {
    return (
        <>
            <Head title="Stock" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Stock" />
                    </CardHeader>
                    <CardContent className="pb-0">
                        {products.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No products yet.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Purchased</TableHead>
                                            <TableHead>Sold</TableHead>
                                            <TableHead>Returned</TableHead>
                                            <TableHead>On hand</TableHead>
                                            <TableHead>Batches</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.data.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell>{formatQty(product.purchased)}</TableCell>
                                                <TableCell>{formatQty(product.sold)}</TableCell>
                                                <TableCell>{formatQty(product.returned)}</TableCell>
                                                <TableCell>{formatQty(product.on_hand)}</TableCell>
                                                <TableCell>{product.batch_count}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button variant="outline" size="icon" className="size-8" asChild>
                                                        <Link href={StockController.show.url(product)}>
                                                            <Eye />
                                                            <span className="sr-only">History</span>
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={products.links}
                                    from={products.from}
                                    to={products.to}
                                    total={products.total}
                                    lastPage={products.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

StockIndex.layout = {
    breadcrumbs: [
        {
            title: 'Stock',
            href: StockController.index(),
        },
    ],
};
