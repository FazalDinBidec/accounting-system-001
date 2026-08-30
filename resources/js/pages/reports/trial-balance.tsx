import { Head } from '@inertiajs/react';
import ReportController from '@/actions/App/Http/Controllers/ReportController';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TrialBalance() {
    return (
        <>
            <Head title="Trial Balance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="border-b py-6">
                        <Heading title="Trial Balance" />
                    </CardHeader>
                    <CardContent className="py-6">
                        <p className="text-sm text-muted-foreground">
                            Trial balance will show here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TrialBalance.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: ReportController.trialBalance(),
        },
        {
            title: 'Trial Balance',
            href: ReportController.trialBalance(),
        },
    ],
};
