import { Head } from '@inertiajs/react';
import CapitalController from '@/actions/App/Http/Controllers/CapitalController';
import CapitalForm from '@/pages/capital/capital-form';
import type { CapitalOption } from '@/pages/capital/types';

export default function CapitalCreate({
    partners,
    cashAccounts,
    bankAccounts,
}: {
    partners: CapitalOption[];
    cashAccounts: CapitalOption[];
    bankAccounts: CapitalOption[];
}) {
    return (
        <>
            <Head title="Create Capital Transaction" />
            <CapitalForm partners={partners} cashAccounts={cashAccounts} bankAccounts={bankAccounts} />
        </>
    );
}

CapitalCreate.layout = {
    breadcrumbs: [
        {
            title: 'Capital Tranx',
            href: CapitalController.index(),
        },
        {
            title: 'Create',
            href: CapitalController.create(),
        },
    ],
};
