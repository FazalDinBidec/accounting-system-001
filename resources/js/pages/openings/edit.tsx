import { Head } from '@inertiajs/react';
import OpeningController from '@/actions/App/Http/Controllers/OpeningController';
import OpeningForm from '@/pages/openings/opening-form';
import type { OpeningOption, PartyOpening } from '@/pages/openings/types';

export default function OpeningsEdit({
    opening,
    parties,
}: {
    opening: PartyOpening;
    parties: OpeningOption[];
}) {
    return (
        <>
            <Head title={`Edit ${opening.number}`} />
            <OpeningForm opening={opening} parties={parties} />
        </>
    );
}

OpeningsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Opening Balances',
            href: OpeningController.index(),
        },
        {
            title: 'Edit',
            href: OpeningController.edit(),
        },
    ],
};
