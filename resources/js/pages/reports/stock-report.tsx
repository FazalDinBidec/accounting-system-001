import { Form, Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ReportOption, StockBatchReport as StockBatchReportData } from '@/pages/reports/types';
import { formatQty } from '@/pages/stock/types';
import { stockReport } from '@/routes/reports';

export default function StockReport({
    products,
    parties,
    filters,
    report,
}: {
    products: ReportOption[];
    parties: ReportOption[];
    filters: {
        product_id: number | null;
        party_id: number | null;
    };
    report: StockBatchReportData;
}) {
    const productOptions = products.map((item) => ({
        value: String(item.id),
        label: item.name,
    }));
    const partyOptions = parties.map((item) => ({
        value: String(item.id),
        label: item.name,
    }));
    const hasFilters = filters.product_id !== null || filters.party_id !== null;

    return (
        <>
            <Head title="Stock Report" />

            <div className="flex h-full flex-1 flex-col overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Stock Report" />
                    </CardHeader>

                    <CardContent className="border-b py-6">
                        <Form
                            method="get"
                            action={ReportController.stockReport.url()}
                            options={{ preserveScroll: true }}
                            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                        >
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="product_id">Product</Label>
                                <FormSelect
                                    id="product_id"
                                    name="product_id"
                                    defaultValue={filters.product_id ? String(filters.product_id) : ''}
                                    placeholder="All products"
                                    emptyLabel="All products"
                                    options={productOptions}
                                />
                            </div>

                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="party_id">Party</Label>
                                <FormSelect
                                    id="party_id"
                                    name="party_id"
                                    defaultValue={filters.party_id ? String(filters.party_id) : ''}
                                    placeholder="All parties"
                                    emptyLabel="All parties"
                                    options={partyOptions}
                                />
                            </div>

                            <Button type="submit">Run report</Button>
                        </Form>
                    </CardContent>

                    <CardContent className="py-6">
                        {report.rows.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">
                                {hasFilters ? 'No batches match the selected filters.' : 'No stock on hand.'}
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Batch No</TableHead>
                                        <TableHead>On Hand</TableHead>
                                        <TableHead>Parties</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.product_name}</TableCell>
                                            <TableCell>{row.batch_no}</TableCell>
                                            <TableCell>{formatQty(row.quantity_on_hand)}</TableCell>
                                            <TableCell>{row.parties}</TableCell>
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

StockReport.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: stockReport(),
        },
        {
            title: 'Stock Report',
            href: stockReport(),
        },
    ],
};
