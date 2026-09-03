import { Form, Head, usePage } from '@inertiajs/react';
import { CalendarRange, Plus } from 'lucide-react';
import { useState } from 'react';
import FiscalYearController from '@/actions/App/Http/Controllers/FiscalYearController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney } from '@/pages/reports/types';

type FiscalPeriodAllocation = {
    id: number;
    party_id: number;
    amount: string;
    party?: { id: number; name: string } | null;
};

type FiscalPeriod = {
    id: number;
    sequence: number;
    start_date: string;
    end_date: string | null;
    is_closed: boolean;
    closed_at: string | null;
    net_profit: string | null;
    allocations?: FiscalPeriodAllocation[];
};

type FiscalYear = {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_closed: boolean;
    closed_at: string | null;
    periods?: FiscalPeriod[];
};

type SharedProps = {
    activeFiscalYear?: FiscalYear | null;
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function FiscalYearsIndex({
    fiscalYears,
    suggested,
}: {
    fiscalYears: FiscalYear[];
    suggested: { name: string; start_date: string; end_date: string };
}) {
    const { activeFiscalYear } = usePage<SharedProps>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [closePeriod, setClosePeriod] = useState<FiscalPeriod | null>(null);
    const [closeDate, setCloseDate] = useState(todayDate());

    const openPeriod = fiscalYears
        .flatMap((year) => year.periods ?? [])
        .find((period) => !period.is_closed);

    return (
        <>
            <Head title="Fiscal Years" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-6">
                        <div className="space-y-1">
                            <Heading title="Fiscal Years" />
                            {activeFiscalYear ? (
                                <p className="text-sm text-muted-foreground">
                                    Active: {activeFiscalYear.name} ({dateInputValue(activeFiscalYear.start_date)} –{' '}
                                    {dateInputValue(activeFiscalYear.end_date)})
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">No active fiscal year.</p>
                            )}
                        </div>
                        <Button onClick={() => setCreateOpen(true)}>
                            <Plus />
                            Add fiscal year
                        </Button>
                    </CardHeader>

                    <CardContent className="space-y-6 py-6">
                        {fiscalYears.length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground">No fiscal years yet.</p>
                        ) : (
                            fiscalYears.map((year) => {
                                const allPeriodsClosed = (year.periods ?? []).every((period) => period.is_closed);
                                const canCloseYear =
                                    year.is_active && !year.is_closed && allPeriodsClosed && (year.periods ?? []).length > 0;

                                return (
                                    <Card key={year.id}>
                                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <CalendarRange className="size-4 text-muted-foreground" />
                                                <h3 className="font-medium">{year.name}</h3>
                                                {year.is_active ? <Badge>Active</Badge> : null}
                                                {year.is_closed ? <Badge variant="secondary">Closed</Badge> : null}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {!year.is_active && !year.is_closed ? (
                                                    <Form {...FiscalYearController.activate.form(year)}>
                                                        {({ processing, submit }) => (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                disabled={processing}
                                                                onClick={() => submit()}
                                                            >
                                                                Activate
                                                            </Button>
                                                        )}
                                                    </Form>
                                                ) : null}
                                                {canCloseYear ? (
                                                    <Form {...FiscalYearController.closeYear.form(year)}>
                                                        {({ processing, submit }) => (
                                                            <Button
                                                                type="button"
                                                                disabled={processing}
                                                                onClick={() => submit()}
                                                            >
                                                                Close fiscal year
                                                            </Button>
                                                        )}
                                                    </Form>
                                                ) : null}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-4">
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                {dateInputValue(year.start_date)} – {dateInputValue(year.end_date)}
                                            </p>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Period</TableHead>
                                                        <TableHead>Start</TableHead>
                                                        <TableHead>End</TableHead>
                                                        <TableHead>Net profit</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Allocations</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(year.periods ?? []).map((period) => (
                                                        <TableRow key={period.id}>
                                                            <TableCell>#{period.sequence}</TableCell>
                                                            <TableCell>{dateInputValue(period.start_date)}</TableCell>
                                                            <TableCell>
                                                                {period.end_date
                                                                    ? dateInputValue(period.end_date)
                                                                    : 'Open'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {period.net_profit !== null
                                                                    ? formatMoney(period.net_profit)
                                                                    : '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {period.is_closed ? (
                                                                    <Badge variant="secondary">Closed</Badge>
                                                                ) : (
                                                                    <Badge>Open</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {(period.allocations ?? []).length === 0
                                                                    ? '—'
                                                                    : (period.allocations ?? [])
                                                                          .map(
                                                                              (allocation) =>
                                                                                  `${allocation.party?.name ?? 'Partner'}: ${formatMoney(allocation.amount)}`,
                                                                          )
                                                                          .join(', ')}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {!period.is_closed &&
                                                                year.is_active &&
                                                                !year.is_closed &&
                                                                openPeriod?.id === period.id ? (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setClosePeriod(period);
                                                                            setCloseDate(todayDate());
                                                                        }}
                                                                    >
                                                                        Close period
                                                                    </Button>
                                                                ) : null}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create fiscal year</DialogTitle>
                        <DialogDescription>Set the annual date range. The first open period starts automatically.</DialogDescription>
                    </DialogHeader>
                    <Form
                        {...FiscalYearController.store.form()}
                        className="space-y-4"
                        options={{ preserveScroll: true }}
                        onSuccess={() => setCreateOpen(false)}
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" defaultValue={suggested.name} required />
                                    {errors.name ? (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">Start date</Label>
                                    <Input
                                        id="start_date"
                                        name="start_date"
                                        type="date"
                                        defaultValue={suggested.start_date}
                                        required
                                    />
                                    {errors.start_date ? (
                                        <p className="text-sm text-destructive">{errors.start_date}</p>
                                    ) : null}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input
                                        id="end_date"
                                        name="end_date"
                                        type="date"
                                        defaultValue={suggested.end_date}
                                        required
                                    />
                                    {errors.end_date ? (
                                        <p className="text-sm text-destructive">{errors.end_date}</p>
                                    ) : null}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button disabled={processing}>Create</Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={closePeriod !== null} onOpenChange={(open) => !open && setClosePeriod(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close fiscal period</DialogTitle>
                        <DialogDescription>
                            Choose the close date for period #{closePeriod?.sequence}. Profit will be split among
                            partners by capital ratio.
                        </DialogDescription>
                    </DialogHeader>
                    {closePeriod ? (
                        <Form
                            {...FiscalYearController.closePeriod.form(closePeriod)}
                            className="space-y-4"
                            options={{ preserveScroll: true }}
                            onSuccess={() => setClosePeriod(null)}
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="close_date">Close date</Label>
                                        <Input
                                            id="close_date"
                                            name="close_date"
                                            type="date"
                                            value={closeDate}
                                            min={dateInputValue(closePeriod.start_date)}
                                            onChange={(event) => setCloseDate(event.target.value)}
                                            required
                                        />
                                        {errors.close_date ? (
                                            <p className="text-sm text-destructive">{errors.close_date}</p>
                                        ) : null}
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button disabled={processing}>Close period</Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}

FiscalYearsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Fiscal Years',
            href: FiscalYearController.index(),
        },
    ],
};
