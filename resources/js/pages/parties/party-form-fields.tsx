import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Party } from '@/pages/parties/types';

export default function PartyFormFields({
    party,
    errors,
}: {
    party?: Pick<Party, 'name' | 'phone' | 'address' | 'is_active' | 'is_partner'>;
    errors: Partial<Record<'name' | 'phone' | 'address' | 'is_active' | 'is_partner', string>>;
}) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        name="name"
                        required
                        defaultValue={party?.name ?? ''}
                        placeholder="Party name"
                        autoFocus
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" defaultValue={party?.phone ?? ''} placeholder="Optional phone" />
                    <InputError message={errors.phone} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    name="address"
                    defaultValue={party?.address ?? ''}
                    placeholder="Optional address"
                    className="min-h-24"
                />
                <InputError message={errors.address} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="is_partner">Partner</Label>
                    <FormSelect
                        id="is_partner"
                        name="is_partner"
                        defaultValue={party?.is_partner ? '1' : '0'}
                        options={[
                            { value: '1', label: 'Yes' },
                            { value: '0', label: 'No' },
                        ]}
                    />
                    <InputError message={errors.is_partner} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="is_active">Status</Label>
                    <FormSelect
                        id="is_active"
                        name="is_active"
                        defaultValue={party?.is_active === false ? '0' : '1'}
                        options={[
                            { value: '1', label: 'Active' },
                            { value: '0', label: 'Inactive' },
                        ]}
                    />
                    <InputError message={errors.is_active} />
                </div>
            </div>
        </div>
    );
}
