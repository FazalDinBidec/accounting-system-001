import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import CapitalController from '@/actions/App/Http/Controllers/CapitalController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { capitalTypeLabel, dateInputValue, formatMoney, toMoneyNumber } from '@/pages/capital/types';
import type { CapitalOption, CapitalTransaction } from '@/pages/capital/types';

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

export default function CapitalForm({
    transaction,
    partners,
    cashAccounts,
    bankAccounts,
}: {
    transaction?: CapitalTransaction;
    partners: CapitalOption[];
    cashAccounts: CapitalOption[];
    bankAccounts: CapitalOption[];
}) {
    const isEditing = transaction !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        type: transaction?.type ?? 'introduction',
        party_id: transaction ? String(transaction.party_id) : '',
        date: transaction ? dateInputValue(transaction.date) : todayDate(),
        notes: transaction?.notes ?? '',
        lines: transaction?.lines?.map((line) => ({
            method: line.method,
            account_id: String(line.account_id),
            amount: line.amount,
            bank_name: line.bank_name ?? '',
            account_no: line.account_no ?? '',
            holder_name: line.holder_name ?? '',
            instrument_no: line.instrument_no ?? '',
        })) ?? [emptyLine()],
    });

    const [balance, setBalance] = useState<{ partyId: string; balance: string } | null>(null);

    useEffect(() => {
        if (data.party_id === '') {
            return;
        }

        const partyId = data.party_id;
        const url = CapitalController.partnerBalance.url(Number(partyId), {
            query: transaction === undefined ? {} : { exclude_transaction_id: transaction.id },
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
            .then((payload: { balance: string }) => {
                if (!cancelled) {
                    setBalance({
                        partyId,
                        balance: payload.balance,
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
    }, [data.party_id, transaction]);

    const totalAmount = data.lines.reduce((sum, line) => sum + toMoneyNumber(line.amount), 0);

    function accountsFor(method: string): CapitalOption[] {
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

        if (isEditing && transaction) {
            put(CapitalController.update.url(transaction));

            return;
        }

        post(CapitalController.store.url());
    }

    const capitalBalance =
        data.party_id === '' || balance === null || balance.partyId !== data.party_id ? null : balance.balance;

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <Card className="overflow-hidden py-0">
                <CardHeader className="border-b py-6">
                    <Heading title={isEditing ? 'Edit Capital Transaction' : 'Create Capital Transaction'} />
                </CardHeader>
                <CardContent className="py-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                {isEditing ? (
                                    <Input id="type" value={capitalTypeLabel(data.type)} disabled />
                                ) : (
                                    <FormSelect
                                        id="type"
                                        value={data.type}
                                        onValueChange={(value) => {
                                            if (value === 'introduction' || value === 'withdrawal') {
                                                setData('type', value);
                                            }
                                        }}
                                        placeholder="Select type"
                                        options={[
                                            { value: 'introduction', label: 'Introduction' },
                                            { value: 'withdrawal', label: 'Payout' },
                                        ]}
                                    />
                                )}
                                <InputError message={errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="party_id">Partner</Label>
                                <FormSelect
                                    id="party_id"
                                    value={data.party_id}
                                    onValueChange={(value) => setData('party_id', value)}
                                    placeholder="Select partner"
                                    emptyLabel="Select partner"
                                    options={partners.map((partner) => ({
                                        value: String(partner.id),
                                        label: partner.name,
                                    }))}
                                />
                                <InputError message={errors.party_id} />
                                {capitalBalance !== null ? (
                                    <p className="text-sm text-muted-foreground">
                                        Capital balance: {formatMoney(capitalBalance)}
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
                                                            { value: 'cash', label: 'Cash' },
                                                            { value: 'bank', label: 'Bank' },
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
                            {isEditing ? 'Update transaction' : 'Save transaction'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
