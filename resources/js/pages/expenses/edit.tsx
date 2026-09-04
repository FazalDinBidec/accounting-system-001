import { Head } from '@inertiajs/react';
import ExpenseController from '@/actions/App/Http/Controllers/ExpenseController';
import ExpenseForm from '@/pages/expenses/expense-form';
import type { Expense, ExpenseOption } from '@/pages/expenses/types';

export default function ExpensesEdit({
    expense,
    expenseAccounts,
    cashAccounts,
    bankAccounts,
}: {
    expense: Expense;
    expenseAccounts: ExpenseOption[];
    cashAccounts: ExpenseOption[];
    bankAccounts: ExpenseOption[];
}) {
    return (
        <>
            <Head title="Edit Expense" />
            <ExpenseForm
                expense={expense}
                expenseAccounts={expenseAccounts}
                cashAccounts={cashAccounts}
                bankAccounts={bankAccounts}
            />
        </>
    );
}

ExpensesEdit.layout = {
    breadcrumbs: [
        {
            title: 'Expenses',
            href: ExpenseController.index(),
        },
        {
            title: 'Edit',
            href: ExpenseController.edit(),
        },
    ],
};
