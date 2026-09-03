import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import VoucherController from '@/actions/App/Http/Controllers/VoucherController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { dateInputValue, formatMoney, toMoneyNumber } from '@/pages/vouchers/types';
import type { Voucher, VoucherOption } from '@/pages/vouchers/types';

type FormLine = {
    method: string;
    account_id: string;
    amount: string;
    bank_name: string;
    account_no: string;
    holder_name: string;
    instrument_no: string;
};

function emptyLine(): FormLine {
    return {
        method: 'cash',
        account_id: '',
        amount: '',
        bank_name: '',
        account_no: '',
        holder_name: '',
        instrument_no: '',
    };
}

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function VoucherForm({
    voucher,
    parties,
    cashAccounts,
    bankAccounts,
}: {
    voucher?: Voucher;
    parties: VoucherOption[];
    cashAccounts: VoucherOption[];
    bankAccounts: VoucherOption[];
}) {
    const isEditing = voucher !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        type: voucher?.type ?? 'receipt',
        party_id: voucher ? String(voucher.party_id) : '',
        date: voucher ? dateInputValue(voucher.date) : todayDate(),
        notes: voucher?.notes ?? '',
        lines: voucher?.lines?.map((line) => ({
            method: line.method,
            account_id: String(line.account_id),
            amount: line.amount,
            bank_name: line.bank_name ?? '',
            account_no: line.account_no ?? '',
            holder_name: line.holder_name ?? '',
            instrument_no: line.instrument_no ?? '',
        })) ?? [emptyLine()],
    });

    const [balance, setBalance] = useState<{
        partyId: string;
        receivable: string;
        payable: string;
    } | null>(null);

    useEffect(() => {
        if (data.party_id === '') {
            return;
        }

        const partyId = data.party_id;
        const url = VoucherController.partyBalance.url(Number(partyId), {
            query: voucher === undefined ? {} : { exclude_voucher_id: voucher.id },
        });

        let cancelled = false;

        void fetch(url, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        })
            .then((response) => response.json())
            .then((payload: { receivable: string; payable: string }) => {
                if (!cancelled) {
                    setBalance({
                        partyId,
                        receivable: payload.receivable,
                        payable: payload.payable,
                    });
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setBalance((current) => (current?.partyId === partyId ? null : current));
                }
            });

        return () => {
            cancelled = true;
        };
    }, [data.party_id, voucher]);

    const totalAmount = data.lines.reduce((sum, line) => sum + toMoneyNumber(line.amount), 0);

    function accountsFor(method: string): VoucherOption[] {
        return method === 'bank' ? bankAccounts : cashAccounts;
    }

    function updateLine(index: number, field: keyof FormLine, value: string): void {
        setData(
            'lines',
            data.lines.map((line, lineIndex) => {
                if (lineIndex !== index) {
                    return line;
                }

                if (field === 'method') {
                    return {
                        ...emptyLine(),
                        method: value,
                    };
                }

                return { ...line, [field]: value };
            }),
        );
    }

    function addLine(): void {
        setData('lines', [...data.lines, emptyLine()]);
    }

    function removeLine(index: number): void {
        setData(
            'lines',
            data.lines.filter((_, lineIndex) => lineIndex !== index),
        );
    }

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isEditing && voucher) {
            put(VoucherController.update.url(voucher));

            return;
        }

        post(VoucherController.store.url());
    }

    const outstandingLabel = data.type === 'payment' ? 'Payable outstanding' : 'Receivable outstanding';
    const outstandingValue =
        data.party_id === '' || balance === null || balance.partyId !== data.party_id
            ? null
            : data.type === 'payment'
              ? balance.payable
              : balance.receivable;

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <Card className="overflow-hidden py-0">
                <CardHeader className="border-b py-6">
                    <Heading title={isEditing ? 'Edit Voucher' : 'Create New Voucher'} />
                </CardHeader>
                <CardContent className="py-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                {isEditing ? (
                                    <Input id="type" value={data.type === 'payment' ? 'Payment' : 'Receipt'} disabled />
                                ) : (
                                    <FormSelect
                                        id="type"
                                        value={data.type}
                                        onValueChange={(value) => {
                                            if (value === 'receipt' || value === 'payment') {
                                                setData('type', value);
                                            }
                                        }}
                                        placeholder="Select type"
                                        options={[
                                            { value: 'receipt', label: 'Receipt' },
                                            { value: 'payment', label: 'Payment' },
                                        ]}
                                    />
                                )}
                                <InputError message={errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="party_id">Party</Label>
                                <FormSelect
                                    id="party_id"
                                    value={data.party_id}
                                    onValueChange={(value) => setData('party_id', value)}
                                    placeholder="Select party"
                                    emptyLabel="Select party"
                                    options={parties.map((party) => ({
                                        value: String(party.id),
                                        label: party.name,
                                    }))}
                                />
                                <InputError message={errors.party_id} />
                                {outstandingValue !== null ? (
                                    <p className="text-sm text-muted-foreground">
                                        {outstandingLabel}: {formatMoney(outstandingValue)}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(event) => setData('date', event.target.value)}
                                />
                                <InputError message={errors.date} />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <Label>Lines</Label>
                            <InputError message={errors.lines} />

                            <Table className="table-fixed [&_td]:py-3 [&_th]:py-3">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%]">Method</TableHead>
                                        <TableHead className="w-[25%]">Account</TableHead>
                                        <TableHead className="w-[47%]">Amount</TableHead>
                                        <TableHead className="w-[3%] text-center" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.lines.map((line, index) => (
                                        <Fragment key={index}>
                                            <TableRow className={line.method === 'bank' ? 'border-b-0' : undefined}>
                                                <TableCell>
                                                    <FormSelect
                                                        value={line.method}
                                                        onValueChange={(value) => updateLine(index, 'method', value)}
                                                        options={[
                                                            {
                                                                value: 'cash',
                                                                label: 'Cash',
                                                            },
                                                            {
                                                                value: 'bank',
                                                                label: 'Bank',
                                                            },
                                                        ]}
                                                    />
                                                    <InputError message={errors[`lines.${index}.method`]} />
                                                </TableCell>
                                                <TableCell>
                                                    <FormSelect
                                                        value={line.account_id}
                                                        onValueChange={(value) =>
                                                            updateLine(index, 'account_id', value)
                                                        }
                                                        placeholder="Select account"
                                                        emptyLabel="Select account"
                                                        options={accountsFor(line.method).map((account) => ({
                                                            value: String(account.id),
                                                            label: account.name,
                                                        }))}
                                                    />
                                                    <InputError message={errors[`lines.${index}.account_id`]} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.amount}
                                                        onChange={(event) =>
                                                            updateLine(index, 'amount', event.target.value)
                                                        }
                                                    />
                                                    <InputError message={errors[`lines.${index}.amount`]} />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={data.lines.length === 1}
                                                        onClick={() => removeLine(index)}
                                                    >
                                                        <Trash2 />
                                                        <span className="sr-only">Remove</span>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {line.method === 'bank' ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="pt-0! whitespace-normal">
                                                        <div className="grid grid-cols-4 gap-3">
                                                            <div className="space-y-1">
                                                                <Label>Bank name</Label>
                                                                <Input
                                                                    value={line.bank_name}
                                                                    onChange={(event) =>
                                                                        updateLine(
                                                                            index,
                                                                            'bank_name',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`lines.${index}.bank_name`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Account no</Label>
                                                                <Input
                                                                    value={line.account_no}
                                                                    onChange={(event) =>
                                                                        updateLine(
                                                                            index,
                                                                            'account_no',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`lines.${index}.account_no`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Holder name</Label>
                                                                <Input
                                                                    value={line.holder_name}
                                                                    onChange={(event) =>
                                                                        updateLine(
                                                                            index,
                                                                            'holder_name',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`lines.${index}.holder_name`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Tranx / Cheque no</Label>
                                                                <Input
                                                                    value={line.instrument_no}
                                                                    onChange={(event) =>
                                                                        updateLine(
                                                                            index,
                                                                            'instrument_no',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`lines.${index}.instrument_no`]}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : null}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>

                            <Button type="button" onClick={addLine}>
                                <Plus />
                                Add line
                            </Button>

                            <div className="flex justify-end">
                                <div className="flex w-full max-w-sm items-center justify-between gap-4 text-base font-semibold">
                                    <span>Total</span>
                                    <span>{formatMoney(totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <Button type="submit" disabled={processing}>
                            {isEditing ? 'Update voucher' : 'Save voucher'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
