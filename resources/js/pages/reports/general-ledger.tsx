import { Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function GeneralLedger() {
    return (
        <>
            <Head title="General Ledger" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="General Ledger" />
                    </CardHeader>
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground">
                            General ledger will show here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

GeneralLedger.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.generalLedger(),
        },
        {
            title: 'General Ledger',
            href: ReportController.generalLedger(),
        },
    ],
};
