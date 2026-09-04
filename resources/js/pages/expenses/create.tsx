import { Head } from '@inertiajs/react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import ExpenseForm from '@/pages/expenses/expense-form';
import type { ExpenseOption } from '@/pages/expenses/types';

export default function ExpensesCreate({
    expenseAccounts,
    cashAccounts,
    bankAccounts,
}: {
    expenseAccounts: ExpenseOption[];
    cashAccounts: ExpenseOption[];
    bankAccounts: ExpenseOption[];
}) {
    return (
        <>
            <Head title="Create Expense" />
            <ExpenseForm
                expenseAccounts={expenseAccounts}
                cashAccounts={cashAccounts}
                bankAccounts={bankAccounts}
            />
        </>
    );
}

ExpensesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Expenses',
            href: ExpenseController.index(),
        },
        {
            title: 'Create',
            href: ExpenseController.create(),
        },
    ],
};
