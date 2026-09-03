import { Form, Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney } from '@/pages/reports/types';
import type { BalanceSheetReport as BalanceSheetReportData } from '@/pages/reports/types';

function SectionTable({
    title,
    rows,
    total,
    showPartner = false,
}: {
    title: string;
    rows: BalanceSheetReportData['assets']['rows'] | BalanceSheetReportData['equity']['rows'];
    total: string;
    showPartner?: boolean;
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
                        {showPartner ? <TableHead>Partner</TableHead> : null}
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow key={`${row.id}-${index}`}>
                            <TableCell>{row.name}</TableCell>
                            {showPartner ? (
                                <TableCell>{'party_name' in row ? (row.party_name ?? '—') : '—'}</TableCell>
                            ) : null}
                            <TableCell className="text-right">{formatMoney(row.amount)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={showPartner ? 2 : 1} className="text-right font-medium">
                            Total {title}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(total)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

export default function BalanceSheet({
    filters,
    report,
}: {
    filters: { to: string | null };
    report: BalanceSheetReportData;
}) {
    const hasActivity =
        report.assets.rows.length > 0 || report.liabilities.rows.length > 0 || report.equity.rows.length > 0;

    return (
        <>
            <Head title="Balance Sheet" />

            <div className="flex h-full flex-1 flex-col overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading
                            title="Balance Sheet"
                            description={filters.to ? `As of ${dateInputValue(filters.to)}` : 'All transactions'}
                        />
                    </CardHeader>

                    <CardContent className="border-b py-6">
                        <Form
                            method="get"
                            action={ReportController.balanceSheet.url()}
                            options={{ preserveScroll: true }}
                            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
                        >
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="to">As of</Label>
                                <Input id="to" name="to" type="date" defaultValue={dateInputValue(filters.to)} />
                            </div>
                            <Button type="submit" className="w-full md:w-auto">
                                Run report
                            </Button>
                        </Form>
                    </CardContent>

                    <CardContent className="pb-0">
                        {!hasActivity ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No balance sheet activity for this date.
                            </p>
                        ) : (
                            <>
                                <SectionTable title="Assets" rows={report.assets.rows} total={report.assets.total} />
                                <SectionTable
                                    title="Liabilities"
                                    rows={report.liabilities.rows}
                                    total={report.liabilities.total}
                                />
                                <SectionTable
                                    title="Equity"
                                    rows={report.equity.rows}
                                    total={report.equity.total}
                                    showPartner
                                />

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="text-right font-medium">Total assets</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(report.assets.total)}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-right font-medium">
                                                Total liabilities & equity
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(report.totals.liabilities_and_equity)}
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

BalanceSheet.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.balanceSheet(),
        },
        {
            title: 'Balance Sheet',
            href: ReportController.balanceSheet(),
        },
    ],
};
