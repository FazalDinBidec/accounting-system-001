import { Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    displayAmount,
    formatMoney,
    type TrialBalanceReport as TrialBalanceReportData,
} from '@/pages/reports/types';

export default function TrialBalance({
    filters,
    report,
}: {
    filters: { to: string | null };
    report: TrialBalanceReportData;
}) {
    const balanced =
        formatMoney(report.totals.debit) === formatMoney(report.totals.credit);

    return (
        <>
            <Head title="Trial Balance" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Trial Balance" />
                    </CardHeader>
                    <CardContent className="py-6">
                        <form
                            method="get"
                            action={ReportController.trialBalance.url()}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="to">As of</Label>
                                <Input
                                    id="to"
                                    name="to"
                                    type="date"
                                    defaultValue={dateInputValue(filters.to)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" className="w-full sm:w-auto">
                                    Run report
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading
                            title="Account balances"
                            description={
                                filters.to
                                    ? `Balances up to ${dateInputValue(filters.to)}`
                                    : 'All posted balances'
                            }
                        />
                    </CardHeader>
                    <CardContent className="pb-0">
                        {report.rows.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                No account balances yet.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Account</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">
                                            Debit
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Credit
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.rows.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.type}</TableCell>
                                            <TableCell className="text-right">
                                                {displayAmount(row.debit)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {displayAmount(row.credit)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            className="text-right font-medium"
                                        >
                                            Total
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(report.totals.debit)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(report.totals.credit)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}

                        {report.rows.length > 0 ? (
                            <p
                                className={`px-4 py-3 text-sm ${
                                    balanced
                                        ? 'text-muted-foreground'
                                        : 'text-destructive'
                                }`}
                            >
                                {balanced
                                    ? 'Debits and credits are balanced.'
                                    : 'Warning: debits and credits do not match.'}
                            </p>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TrialBalance.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.trialBalance(),
        },
        {
            title: 'Trial Balance',
            href: ReportController.trialBalance(),
        },
    ],
};
