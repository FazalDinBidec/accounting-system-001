import { Head } from '@inertiajs/react';
import VoucherController from '@/actions/App/Http/Controllers/VoucherController';
import VoucherForm from '@/pages/vouchers/voucher-form';
import type { Voucher, VoucherOption } from '@/pages/vouchers/types';

export default function VoucherEdit({
    voucher,
    parties,
    cashAccounts,
    bankAccounts,
}: {
    voucher: Voucher;
    parties: VoucherOption[];
    cashAccounts: VoucherOption[];
    bankAccounts: VoucherOption[];
}) {
    return (
        <>
            <Head title="Edit Voucher" />
            <VoucherForm voucher={voucher} parties={parties} cashAccounts={cashAccounts} bankAccounts={bankAccounts} />
        </>
    );
}

VoucherEdit.layout = {
    breadcrumbs: [
        {
            title: 'Vouchers',
            href: VoucherController.index(),
        },
        {
            title: 'Edit',
            href: VoucherController.index(),
        },
    ],
};
