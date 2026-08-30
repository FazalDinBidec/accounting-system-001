import { Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import FormSelect from '@/components/form-select';
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
import { accountTypeLabels } from '@/pages/accounts/types';
import type { AccountType } from '@/pages/accounts/types';
import {
    dateInputValue,
    displayAmount,
    formatMoney,
    type GeneralLedgerReport as GeneralLedgerReportData,
    type ReportOption,
} from '@/pages/reports/types';

type AccountOption = ReportOption & {
    type: AccountType;
};

export default function GeneralLedger({
    accounts,
    filters,
    account,
    report,
}: {
    accounts: AccountOption[];
    filters: {
        account_id: number | null;
        from: string | null;
        to: string | null;
    };
    account: AccountOption | null;
    report: GeneralLedgerReportData | null;
}) {
    const accountOptions = accounts.map((item) => ({
        value: String(item.id),
        label: item.name,
    }));

    return (
        <>
            <Head title="General Ledger" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="General Ledger" />
                    </CardHeader>
                    <CardContent className="py-6">
                        <form
                            method="get"
                            action={ReportController.generalLedger.url()}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="account_id">Account</Label>
                                <FormSelect
                                    id="account_id"
                                    name="account_id"
                                    value={
                                        filters.account_id
                                            ? String(filters.account_id)
                                            : ''
                                    }
                                    placeholder="Select account"
                                    options={accountOptions}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="from">From</Label>
                                <Input
                                    id="from"
                                    name="from"
                                    type="date"
                                    defaultValue={dateInputValue(filters.from)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="to">To</Label>
                                <Input
                                    id="to"
                                    name="to"
                                    type="date"
                                    defaultValue={dateInputValue(filters.to)}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto"
                                >
                                    Run report
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {account && report ? (
                    <Card className="overflow-hidden py-0">
                        <CardHeader className="border-b py-6">
                            <Heading
                                title={account.name}
                                description={
                                    accountTypeLabels[account.type] ??
                                    account.type
                                }
                            />
                        </CardHeader>
                        <CardContent className="pb-0">
                            {report.opening !== null ? (
                                <div className="border-b px-4 py-3 text-sm text-muted-foreground">
                                    Opening balance:{' '}
                                    {formatMoney(report.opening)}
                                </div>
                            ) : null}

                            {report.rows.length === 0 ? (
                                <p className="p-4 text-center text-sm text-muted-foreground">
                                    No transactions in this period.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Reference</TableHead>
                                            <TableHead>Party</TableHead>
                                            <TableHead>Narration</TableHead>
                                            <TableHead className="text-right">
                                                Debit
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Credit
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Balance
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.rows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>
                                                    {dateInputValue(row.date)}
                                                </TableCell>
                                                <TableCell>
                                                    {row.type}
                                                </TableCell>
                                                <TableCell>
                                                    {row.reference}
                                                </TableCell>
                                                <TableCell>
                                                    {row.party ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {row.narration ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {displayAmount(row.debit)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {displayAmount(row.credit)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatMoney(row.balance)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-right font-medium"
                                            >
                                                Closing balance
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(report.closing)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden py-0">
                        <CardContent className="py-6">
                            <p className="text-sm text-muted-foreground">
                                Select an account and run the report to view the
                                ledger.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

GeneralLedger.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.generalLedger(),
        },
        {
            title: 'General Ledger',
            href: ReportController.generalLedger(),
        },
    ],
};
