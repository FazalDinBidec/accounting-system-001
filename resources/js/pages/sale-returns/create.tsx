import { Head } from '@inertiajs/react';
import SaleReturnController from '@/actions/App/Http/Controllers/SaleReturnController';
import SaleReturnForm from '@/pages/sale-returns/sale-return-form';
import type { ReturnableSale } from '@/pages/sale-returns/types';

export default function SaleReturnCreate({
    sale,
}: {
    sale: ReturnableSale | null;
}) {
    return (
        <>
            <Head title="Create New Sale Return" />
            <SaleReturnForm sale={sale} />
        </>
    );
}

SaleReturnCreate.layout = {
    breadcrumbs: [
        {
            title: 'Sale Returns',
            href: SaleReturnController.index(),
        },
        {
            title: 'Create',
            href: SaleReturnController.create(),
        },
    ],
};
