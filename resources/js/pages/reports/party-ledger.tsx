import { Form, Head } from '@inertiajs/react';
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
import {
    dateInputValue,
    displayAmount,
    formatMoney,
    type PartyLedgerReport as PartyLedgerReportData,
    type ReportOption,
} from '@/pages/reports/types';

export default function PartyLedger({
    parties,
    filters,
    party,
    report,
}: {
    parties: ReportOption[];
    filters: {
        party_id: number | null;
        from: string | null;
        to: string | null;
    };
    party: ReportOption | null;
    report: PartyLedgerReportData | null;
}) {
    const partyOptions = parties.map((item) => ({
        value: String(item.id),
        label: item.name,
    }));

    return (
        <>
            <Head title="Party Ledger" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Party Ledger" />
                    </CardHeader>
                    <CardContent className="py-6">
                        <Form
                            method="get"
                            action={ReportController.partyLedger.url()}
                            preserveScroll
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="party_id">Party</Label>
                                <FormSelect
                                    id="party_id"
                                    name="party_id"
                                    defaultValue={
                                        filters.party_id
                                            ? String(filters.party_id)
                                            : ''
                                    }
                                    placeholder="Select party"
                                    options={partyOptions}
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
                        </Form>
                    </CardContent>
                </Card>

                {party && report ? (
                    <Card className="overflow-hidden py-0">
                        <CardHeader className="border-b py-6">
                            <Heading
                                title={party.name}
                                description="Receivable, payable, and net balance by transaction."
                            />
                        </CardHeader>
                        <CardContent className="pb-0">
                            {report.opening ? (
                                <div className="border-b px-4 py-3 text-sm text-muted-foreground">
                                    Opening balance — Receivable:{' '}
                                    {formatMoney(report.opening.receivable)},{' '}
                                    Payable:{' '}
                                    {formatMoney(report.opening.payable)}, Net:{' '}
                                    {formatMoney(report.opening.net)}
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
                                            <TableHead>Account</TableHead>
                                            <TableHead className="text-right">
                                                Debit
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Credit
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Receivable
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Payable
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Net
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
                                                    {row.account}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {displayAmount(row.debit)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {displayAmount(row.credit)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatMoney(
                                                        row.receivable,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatMoney(row.payable)}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatMoney(row.net)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-right font-medium"
                                            >
                                                Closing balance
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(
                                                    report.closing.receivable,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(
                                                    report.closing.payable,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(
                                                    report.closing.net,
                                                )}
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
                                Select a party and run the report to view the
                                ledger.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

PartyLedger.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.partyLedger(),
        },
        {
            title: 'Party Ledger',
            href: ReportController.partyLedger(),
        },
    ],
};
