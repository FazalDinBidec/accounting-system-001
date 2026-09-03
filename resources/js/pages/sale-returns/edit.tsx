import { Head } from '@inertiajs/react';
import SaleReturnController from '@/actions/App/Http/Controllers/SaleReturnController';
import SaleReturnForm from '@/pages/sale-returns/sale-return-form';
import type { ReturnableSale, SaleReturn } from '@/pages/sale-returns/types';

export default function SaleReturnEdit({ saleReturn, sale }: { saleReturn: SaleReturn; sale: ReturnableSale }) {
    return (
        <>
            <Head title="Edit Sale Return" />
            <SaleReturnForm sale={sale} saleReturn={saleReturn} />
        </>
    );
}

SaleReturnEdit.layout = {
    breadcrumbs: [
        {
            title: 'Sale Returns',
            href: SaleReturnController.index(),
        },
        {
            title: 'Edit',
            href: SaleReturnController.index(),
        },
    ],
};
