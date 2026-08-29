import { Head } from '@inertiajs/react';
import SaleOrderController from '@/actions/App/Http/Controllers/SaleOrderController';
import SaleForm from '@/pages/sales/sale-form';
import type { SaleOption } from '@/pages/sales/types';

export default function SaleCreate({
    parties,
    products,
}: {
    parties: SaleOption[];
    products: SaleOption[];
}) {
    return (
        <>
            <Head title="Create New Sale" />
            <SaleForm parties={parties} products={products} />
        </>
    );
}

SaleCreate.layout = {
    breadcrumbs: [
        {
            title: 'Sales',
            href: SaleOrderController.index(),
        },
        {
            title: 'Create',
            href: SaleOrderController.create(),
        },
    ],
};
