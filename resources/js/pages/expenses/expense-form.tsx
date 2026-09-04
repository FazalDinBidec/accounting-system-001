import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { Fragment } from 'react';
import type { SubmitEvent } from 'react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { dateInputValue, formatMoney, toMoneyNumber } from '@/pages/expenses/types';
import type { Expense, ExpenseOption } from '@/pages/expenses/types';

type ExpenseFormLine = {
    account_id: string;
    amount: string;
    narration: string;
};

type PaymentFormLine = {
    method: string;
    account_id: string;
    amount: string;
    bank_name: string;
    account_no: string;
    holder_name: string;
    instrument_no: string;
};

function emptyExpenseLine(): ExpenseFormLine {
    return {
        account_id: '',
        amount: '',
        narration: '',
    };
}

function emptyPaymentLine(): PaymentFormLine {
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

export default function ExpenseForm({
    expense,
    expenseAccounts,
    cashAccounts,
    bankAccounts,
}: {
    expense?: Expense;
    expenseAccounts: ExpenseOption[];
    cashAccounts: ExpenseOption[];
    bankAccounts: ExpenseOption[];
}) {
    const isEditing = expense !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        date: expense ? dateInputValue(expense.date) : todayDate(),
        notes: expense?.notes ?? '',
        expense_lines:
            expense?.expenseLines?.map((line) => ({
                account_id: String(line.account_id),
                amount: line.amount,
                narration: line.narration ?? '',
            })) ?? [emptyExpenseLine()],
        payment_lines:
            expense?.paymentLines?.map((line) => ({
                method: line.method,
                account_id: String(line.account_id),
                amount: line.amount,
                bank_name: line.bank_name ?? '',
                account_no: line.account_no ?? '',
                holder_name: line.holder_name ?? '',
                instrument_no: line.instrument_no ?? '',
            })) ?? [emptyPaymentLine()],
    });

    const expenseTotal = data.expense_lines.reduce((sum, line) => sum + toMoneyNumber(line.amount), 0);
    const paymentTotal = data.payment_lines.reduce((sum, line) => sum + toMoneyNumber(line.amount), 0);
    const totalsMatch = formatMoney(expenseTotal) === formatMoney(paymentTotal);

    function accountsFor(method: string): ExpenseOption[] {
        return method === 'bank' ? bankAccounts : cashAccounts;
    }

    function updateExpenseLine(index: number, field: keyof ExpenseFormLine, value: string): void {
        setData(
            'expense_lines',
            data.expense_lines.map((line, lineIndex) => {
                if (lineIndex !== index) {
                    return line;
                }

                return { ...line, [field]: value };
            }),
        );
    }

    function updatePaymentLine(index: number, field: keyof PaymentFormLine, value: string): void {
        setData(
            'payment_lines',
            data.payment_lines.map((line, lineIndex) => {
                if (lineIndex !== index) {
                    return line;
                }

                if (field === 'method') {
                    return {
                        ...emptyPaymentLine(),
                        method: value,
                    };
                }

                return { ...line, [field]: value };
            }),
        );
    }

    function addExpenseLine(): void {
        setData('expense_lines', [...data.expense_lines, emptyExpenseLine()]);
    }

    function removeExpenseLine(index: number): void {
        setData(
            'expense_lines',
            data.expense_lines.filter((_, lineIndex) => lineIndex !== index),
        );
    }

    function addPaymentLine(): void {
        setData('payment_lines', [...data.payment_lines, emptyPaymentLine()]);
    }

    function removePaymentLine(index: number): void {
        setData(
            'payment_lines',
            data.payment_lines.filter((_, lineIndex) => lineIndex !== index),
        );
    }

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isEditing && expense) {
            put(ExpenseController.update.url(expense));

            return;
        }

        post(ExpenseController.store.url());
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <Card className="overflow-hidden py-0">
                <CardHeader className="border-b py-6">
                    <Heading title={isEditing ? 'Edit Expense' : 'Create Expense'} />
                </CardHeader>
                <CardContent className="py-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="space-y-4">
                            <Label>Expense lines</Label>
                            <InputError message={errors.expense_lines} />

                            <Table className="table-fixed [&_td]:py-3 [&_th]:py-3">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[35%]">Expense account</TableHead>
                                        <TableHead className="w-[25%]">Amount</TableHead>
                                        <TableHead className="w-[37%]">Narration</TableHead>
                                        <TableHead className="w-[3%] text-center" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.expense_lines.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <FormSelect
                                                    value={line.account_id}
                                                    onValueChange={(value) => updateExpenseLine(index, 'account_id', value)}
                                                    placeholder="Select account"
                                                    emptyLabel="Select account"
                                                    options={expenseAccounts.map((account) => ({
                                                        value: String(account.id),
                                                        label: account.name,
                                                    }))}
                                                />
                                                <InputError message={errors[`expense_lines.${index}.account_id`]} />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={line.amount}
                                                    onChange={(event) =>
                                                        updateExpenseLine(index, 'amount', event.target.value)
                                                    }
                                                />
                                                <InputError message={errors[`expense_lines.${index}.amount`]} />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={line.narration}
                                                    onChange={(event) =>
                                                        updateExpenseLine(index, 'narration', event.target.value)
                                                    }
                                                />
                                                <InputError message={errors[`expense_lines.${index}.narration`]} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={data.expense_lines.length === 1}
                                                    onClick={() => removeExpenseLine(index)}
                                                >
                                                    <Trash2 />
                                                    <span className="sr-only">Remove</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Button type="button" onClick={addExpenseLine}>
                                <Plus />
                                Add expense line
                            </Button>

                            <div className="flex justify-end">
                                <div className="flex w-full max-w-sm items-center justify-between gap-4 text-base font-semibold">
                                    <span>Expense total</span>
                                    <span>{formatMoney(expenseTotal)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>Payment lines</Label>
                            <InputError message={errors.payment_lines} />

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
                                    {data.payment_lines.map((line, index) => (
                                        <Fragment key={index}>
                                            <TableRow className={line.method === 'bank' ? 'border-b-0' : undefined}>
                                                <TableCell>
                                                    <FormSelect
                                                        value={line.method}
                                                        onValueChange={(value) => updatePaymentLine(index, 'method', value)}
                                                        options={[
                                                            { value: 'cash', label: 'Cash' },
                                                            { value: 'bank', label: 'Bank' },
                                                        ]}
                                                    />
                                                    <InputError message={errors[`payment_lines.${index}.method`]} />
                                                </TableCell>
                                                <TableCell>
                                                    <FormSelect
                                                        value={line.account_id}
                                                        onValueChange={(value) =>
                                                            updatePaymentLine(index, 'account_id', value)
                                                        }
                                                        placeholder="Select account"
                                                        emptyLabel="Select account"
                                                        options={accountsFor(line.method).map((account) => ({
                                                            value: String(account.id),
                                                            label: account.name,
                                                        }))}
                                                    />
                                                    <InputError message={errors[`payment_lines.${index}.account_id`]} />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.amount}
                                                        onChange={(event) =>
                                                            updatePaymentLine(index, 'amount', event.target.value)
                                                        }
                                                    />
                                                    <InputError message={errors[`payment_lines.${index}.amount`]} />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="size-8"
                                                        disabled={data.payment_lines.length === 1}
                                                        onClick={() => removePaymentLine(index)}
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
                                                                        updatePaymentLine(
                                                                            index,
                                                                            'bank_name',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`payment_lines.${index}.bank_name`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Account no</Label>
                                                                <Input
                                                                    value={line.account_no}
                                                                    onChange={(event) =>
                                                                        updatePaymentLine(
                                                                            index,
                                                                            'account_no',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`payment_lines.${index}.account_no`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Holder name</Label>
                                                                <Input
                                                                    value={line.holder_name}
                                                                    onChange={(event) =>
                                                                        updatePaymentLine(
                                                                            index,
                                                                            'holder_name',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={errors[`payment_lines.${index}.holder_name`]}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label>Tranx / Cheque no</Label>
                                                                <Input
                                                                    value={line.instrument_no}
                                                                    onChange={(event) =>
                                                                        updatePaymentLine(
                                                                            index,
                                                                            'instrument_no',
                                                                            event.target.value,
                                                                        )
                                                                    }
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors[`payment_lines.${index}.instrument_no`]
                                                                    }
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

                            <Button type="button" onClick={addPaymentLine}>
                                <Plus />
                                Add payment line
                            </Button>

                            <div className="flex justify-end">
                                <div className="flex w-full max-w-sm flex-col gap-2 text-base font-semibold">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>Payment total</span>
                                        <span>{formatMoney(paymentTotal)}</span>
                                    </div>
                                    {!totalsMatch ? (
                                        <p className="text-sm font-normal text-destructive">
                                            Expense and payment totals must match.
                                        </p>
                                    ) : null}
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

                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={processing || !totalsMatch}>
                                {isEditing ? 'Update expense' : 'Save expense'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
