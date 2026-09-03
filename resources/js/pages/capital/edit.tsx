import { Head } from '@inertiajs/react';
import CapitalController from '@/actions/App/Http/Controllers/CapitalController';
import CapitalForm from '@/pages/capital/capital-form';
import type { CapitalOption, CapitalTransaction } from '@/pages/capital/types';

export default function CapitalEdit({
    transaction,
    partners,
    cashAccounts,
    bankAccounts,
}: {
    transaction: CapitalTransaction;
    partners: CapitalOption[];
    cashAccounts: CapitalOption[];
    bankAccounts: CapitalOption[];
}) {
    return (
        <>
            <Head title="Edit Capital Transaction" />
            <CapitalForm
            transaction={transaction}
            partners={partners}
            cashAccounts={cashAccounts}
            bankAccounts={bankAccounts}
            />
        </>
    );
}

CapitalEdit.layout = {
    breadcrumbs: [
        {
            title: 'Capital Tranx',
            href: CapitalController.index(),
        },
        {
            title: 'Edit',
            href: CapitalController.edit(),
        },
    ],
};
