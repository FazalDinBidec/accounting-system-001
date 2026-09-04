import { useForm } from '@inertiajs/react';
import type { SubmitEvent } from 'react';
import OpeningController from '@/actions/App/Http/Controllers/OpeningController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dateInputValue, openingTypeLabel } from '@/pages/openings/types';
import type { OpeningOption, PartyOpening } from '@/pages/openings/types';

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function OpeningForm({
    opening,
    parties,
}: {
    opening?: PartyOpening;
    parties: OpeningOption[];
}) {
    const isEditing = opening !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        type: opening?.type ?? 'receivable',
        party_id: opening ? String(opening.party_id) : '',
        date: opening ? dateInputValue(opening.date) : todayDate(),
        amount: opening?.amount ?? '',
        notes: opening?.notes ?? '',
    });

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isEditing && opening) {
            put(OpeningController.update.url(opening));

            return;
        }

        post(OpeningController.store.url());
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <Card className="overflow-hidden py-0">
                <CardHeader className="border-b py-6">
                    <Heading title={isEditing ? 'Edit Opening Balance' : 'Create Opening Balance'} />
                </CardHeader>
                <CardContent className="py-6">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                {isEditing ? (
                                    <Input id="type" value={openingTypeLabel(data.type)} disabled />
                                ) : (
                                    <FormSelect
                                        id="type"
                                        value={data.type}
                                        onValueChange={(value) => {
                                            if (value === 'receivable' || value === 'payable') {
                                                setData('type', value);
                                            }
                                        }}
                                        placeholder="Select type"
                                        options={[
                                            { value: 'receivable', label: 'Receivable' },
                                            { value: 'payable', label: 'Payable' },
                                        ]}
                                    />
                                )}
                                <InputError message={errors.type} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="party_id">Party</Label>
                                <FormSelect
                                    id="party_id"
                                    value={data.party_id}
                                    onValueChange={(value) => setData('party_id', value)}
                                    placeholder="Select party"
                                    emptyLabel="Select party"
                                    options={parties.map((party) => ({
                                        value: String(party.id),
                                        label: party.name,
                                    }))}
                                />
                                <InputError message={errors.party_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(event) => setData('date', event.target.value)}
                                />
                                <InputError message={errors.date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(event) => setData('amount', event.target.value)}
                                />
                                <InputError message={errors.amount} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={processing}>
                                {isEditing ? 'Update opening balance' : 'Save opening balance'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
