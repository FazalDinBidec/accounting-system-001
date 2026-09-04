import { Head, Link } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dateInputValue, formatMoney } from '@/pages/expenses/types';
import type { Expense, PaginatedExpenses } from '@/pages/expenses/types';

export default function ExpensesIndex({ expenses }: { expenses: PaginatedExpenses }) {
    const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function expenseSummary(expense: Expense): string {
        if (!expense.expenseLines || expense.expenseLines.length === 0) {
            return '—';
        }

        return expense.expenseLines
            .map((line) => line.account?.name ?? '—')
            .join(', ');
    }

    function paymentSummary(expense: Expense): string {
        if (!expense.paymentLines || expense.paymentLines.length === 0) {
            return '—';
        }

        return expense.paymentLines
            .map((line) => {
                const method = line.method === 'bank' ? 'Bank' : 'Cash';
                const account = line.account?.name ?? '—';

                return `${method}: ${account}`;
            })
            .join(', ');
    }

    return (
        <>
            <Head title="Expenses" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b py-6">
                        <Heading title="Expenses" />
                        <Button asChild>
                            <Link href={ExpenseController.create.url()}>
                                <Plus />
                                Add expense
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {expenses.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No expenses yet.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Number</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Expense accounts</TableHead>
                                            <TableHead>Payment</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-center">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.data.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{expense.number}</TableCell>
                                                <TableCell>{dateInputValue(expense.date)}</TableCell>
                                                <TableCell>{expenseSummary(expense)}</TableCell>
                                                <TableCell>{paymentSummary(expense)}</TableCell>
                                                <TableCell>{formatMoney(expense.amount)}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            asChild
                                                        >
                                                            <Link href={ExpenseController.edit.url(expense)}>
                                                                <Pencil />
                                                                <span className="sr-only">Edit</span>
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() => {
                                                                setDeleteExpense(expense);
                                                                setDeleteOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={expenses.links}
                                    from={expenses.from}
                                    to={expenses.to}
                                    total={expenses.total}
                                    lastPage={expenses.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete expense"
                description={
                    deleteExpense ? `Delete ${deleteExpense.number}? This cannot be undone.` : 'This cannot be undone.'
                }
                action={deleteExpense ? ExpenseController.destroy.form(deleteExpense) : undefined}
            />
        </>
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Expenses',
            href: ExpenseController.index(),
        },
    ],
};
