import { Form, Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney } from '@/pages/reports/types';
import type { CapitalSummaryReport } from '@/pages/reports/types';

function periodDescription(from: string | null, to: string | null): string {
    if (from && to) {
        return `${dateInputValue(from)} – ${dateInputValue(to)}`;
    }

    if (from) {
        return `From ${dateInputValue(from)}`;
    }

    if (to) {
        return `Up to ${dateInputValue(to)}`;
    }

    return 'All transactions';
}

export default function CapitalSummary({
    filters,
    report,
}: {
    filters: {
        from: string | null;
        to: string | null;
    };
    report: CapitalSummaryReport;
}) {
    return (
        <>
            <Head title="Capital Summary" />

            <div className="flex h-full flex-1 flex-col overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Capital Summary" description={periodDescription(filters.from, filters.to)} />
                    </CardHeader>

                    <CardContent className="border-b py-6">
                        <Form
                            method="get"
                            action={ReportController.capitalSummary.url()}
                            options={{ preserveScroll: true }}
                            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                        >
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="from">From</Label>
                                <Input id="from" name="from" type="date" defaultValue={dateInputValue(filters.from)} />
                            </div>
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="to">To</Label>
                                <Input id="to" name="to" type="date" defaultValue={dateInputValue(filters.to)} />
                            </div>
                            <Button type="submit" className="w-full md:col-start-3 md:w-auto md:justify-self-start">
                                Run report
                            </Button>
                        </Form>
                    </CardContent>

                    <CardContent className="pb-0">
                        {report.rows.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">No partner capital data.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Partner</TableHead>
                                        <TableHead className="text-right">Allocated profit</TableHead>
                                        <TableHead className="text-right">Withdrawn</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.rows.map((row) => (
                                        <TableRow key={row.party_id}>
                                            <TableCell>{row.party_name}</TableCell>
                                            <TableCell className="text-right">{formatMoney(row.allocated)}</TableCell>
                                            <TableCell className="text-right">{formatMoney(row.withdrawn)}</TableCell>
                                            <TableCell className="text-right">{formatMoney(row.balance)}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell className="font-medium">Totals</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(report.totals.allocated)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(report.totals.withdrawn)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(report.totals.balance)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CapitalSummary.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.capitalSummary(),
        },
        {
            title: 'Capital Summary',
            href: ReportController.capitalSummary(),
        },
    ],
};
