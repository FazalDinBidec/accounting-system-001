import { Head } from '@inertiajs/react';
import OpeningController from '@/actions/App/Http/Controllers/OpeningController';
import OpeningForm from '@/pages/openings/opening-form';
import type { OpeningOption } from '@/pages/openings/types';

export default function OpeningsCreate({ parties }: { parties: OpeningOption[] }) {
    return (
        <>
            <Head title="Create Opening Balance" />
            <OpeningForm parties={parties} />
        </>
    );
}

OpeningsCreate.layout = {
    breadcrumbs: [
        {
            title: 'Opening Balances',
            href: OpeningController.index(),
        },
        {
            title: 'Create',
            href: OpeningController.create(),
        },
    ],
};
