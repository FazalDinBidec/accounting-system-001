import { Form, Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, displayAmount, formatMoney } from '@/pages/reports/types';
import type { ProfitAndLossReport as ProfitAndLossReportData } from '@/pages/reports/types';

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

function SectionTable({
    title,
    rows,
    total,
}: {
    title: string;
    rows: ProfitAndLossReportData['income']['rows'];
    total: string;
}) {
    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <h3 className="px-4 pt-4 text-sm font-medium">{title}</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="text-right">{displayAmount(row.amount)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell className="text-right font-medium">Total {title}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(total)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

export default function ProfitAndLoss({
    filters,
    report,
}: {
    filters: {
        from: string | null;
        to: string | null;
    };
    report: ProfitAndLossReportData;
}) {
    const hasActivity = report.income.rows.length > 0 || report.expenses.rows.length > 0;
    const isLoss = report.net_label === 'Net Loss';

    return (
        <>
            <Head title="Profit & Loss" />

            <div className="flex h-full flex-1 flex-col overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Profit & Loss" description={periodDescription(filters.from, filters.to)} />
                    </CardHeader>

                    <CardContent className="border-b py-6">
                        <Form
                            method="get"
                            action={ReportController.profitAndLoss.url()}
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
                        {!hasActivity ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No income or expense activity for this period.
                            </p>
                        ) : (
                            <>
                                <SectionTable title="Income" rows={report.income.rows} total={report.income.total} />
                                <SectionTable
                                    title="Expenses"
                                    rows={report.expenses.rows}
                                    total={report.expenses.total}
                                />

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="text-right font-medium">{report.net_label}</TableCell>
                                            <TableCell
                                                className={`text-right font-medium ${isLoss ? 'text-destructive' : ''}`}
                                            >
                                                {formatMoney(report.net)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ProfitAndLoss.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.profitAndLoss(),
        },
        {
            title: 'Profit & Loss',
            href: ReportController.profitAndLoss(),
        },
    ],
};
