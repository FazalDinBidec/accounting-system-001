import { Head } from '@inertiajs/react';
import SaleOrderController from '@/actions/App/Http/Controllers/SaleOrderController';
import SaleForm from '@/pages/sales/sale-form';
import type { SaleOption, SaleOrder } from '@/pages/sales/types';

export default function SaleEdit({
    sale,
    parties,
    products,
}: {
    sale: SaleOrder;
    parties: SaleOption[];
    products: SaleOption[];
}) {
    return (
        <>
            <Head title="Edit Sale" />
            <SaleForm sale={sale} parties={parties} products={products} />
        </>
    );
}

SaleEdit.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: SaleOrderController.index(),
        },
        {
            title: 'Edit',
            href: SaleOrderController.index(),
        },
    ],
};
