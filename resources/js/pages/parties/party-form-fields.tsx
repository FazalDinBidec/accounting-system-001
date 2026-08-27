import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Party } from '@/pages/parties/types';

const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

const textareaClassName =
    'flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export default function PartyFormFields({
    party,
    errors,
}: {
    party?: Pick<Party, 'name' | 'phone' | 'address' | 'is_active'>;
    errors: Partial<Record<'name' | 'phone' | 'address' | 'is_active', string>>;
}) {
    return (
        <>
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
                <Input
                    id="phone"
                    name="phone"
                    defaultValue={party?.phone ?? ''}
                    placeholder="Optional phone"
                />
                <InputError message={errors.phone} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                    id="address"
                    name="address"
                    defaultValue={party?.address ?? ''}
                    placeholder="Optional address"
                    className={textareaClassName}
                />
                <InputError message={errors.address} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="is_active">Status</Label>
                <select
                    id="is_active"
                    name="is_active"
                    defaultValue={party?.is_active === false ? '0' : '1'}
                    className={selectClassName}
                >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
                <InputError message={errors.is_active} />
            </div>
        </>
    );
}
