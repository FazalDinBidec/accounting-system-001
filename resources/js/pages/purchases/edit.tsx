import { Head } from '@inertiajs/react';
import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
import PurchaseForm from '@/pages/purchases/purchase-form';
import type { PurchaseOption, PurchaseOrder } from '@/pages/purchases/types';

export default function PurchaseEdit({
    purchase,
    parties,
    products,
}: {
    purchase: PurchaseOrder;
    parties: PurchaseOption[];
    products: PurchaseOption[];
}) {
    return (
        <>
            <Head title="Edit Purchase" />
            <PurchaseForm purchase={purchase} parties={parties} products={products} />
        </>
    );
}

PurchaseEdit.layout = {
    breadcrumbs: [
        {
            title: 'Purchases',
            href: PurchaseOrderController.index(),
        },
        {
            title: 'Edit',
            href: PurchaseOrderController.index(),
        },
    ],
};
