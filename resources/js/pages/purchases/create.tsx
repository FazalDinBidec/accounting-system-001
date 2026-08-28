import { Head } from '@inertiajs/react';
import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
import PurchaseForm from '@/pages/purchases/purchase-form';
import type { PurchaseOption } from '@/pages/purchases/types';

export default function PurchaseCreate({
    parties,
    products,
}: {
    parties: PurchaseOption[];
    products: PurchaseOption[];
}) {
    return (
        <>
            <Head title="Create New Purchase" />
            <PurchaseForm parties={parties} products={products} />
        </>
    );
}

PurchaseCreate.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: PurchaseOrderController.index(),
        },
        {
            title: 'Create',
            href: PurchaseOrderController.create(),
        },
    ],
};
