import { Head } from '@inertiajs/react';
import VoucherController from '@/actions/App/Http/Controllers/VoucherController';
import VoucherForm from '@/pages/vouchers/voucher-form';
import type { VoucherOption } from '@/pages/vouchers/types';

export default function VoucherCreate({
    parties,
    cashAccounts,
    bankAccounts,
}: {
    parties: VoucherOption[];
    cashAccounts: VoucherOption[];
    bankAccounts: VoucherOption[];
}) {
    return (
        <>
            <Head title="Create New Voucher" />
            <VoucherForm parties={parties} cashAccounts={cashAccounts} bankAccounts={bankAccounts} />
        </>
    );
}

VoucherCreate.layout = {
    breadcrumbs: [
        {
            title: 'Vouchers',
            href: VoucherController.index(),
        },
        {
            title: 'Create',
            href: VoucherController.create(),
        },
    ],
};
