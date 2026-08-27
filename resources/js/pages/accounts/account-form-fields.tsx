import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    accountTypeLabels,
    type Account,
    type AccountParentOption,
    type AccountType,
} from '@/pages/accounts/types';

const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

const accountTypes = Object.entries(accountTypeLabels) as [
    AccountType,
    string,
][];

export default function AccountFormFields({
    account,
    parents,
    errors,
}: {
    account?: Pick<Account, 'name' | 'type' | 'parent_id' | 'is_active'>;
    parents: AccountParentOption[];
    errors: Partial<Record<'name' | 'type' | 'parent_id' | 'is_active', string>>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={account?.name ?? ''}
                    placeholder="Account name"
                    autoFocus
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <select
                    id="type"
                    name="type"
                    defaultValue={account?.type ?? 'asset'}
                    className={selectClassName}
                >
                    {accountTypes.map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
                <InputError message={errors.type} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="parent_id">Parent</Label>
                <select
                    id="parent_id"
                    name="parent_id"
                    defaultValue={account?.parent_id ?? ''}
                    className={selectClassName}
                >
                    <option value="">None</option>
                    {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                            {parent.name}
                        </option>
                    ))}
                </select>
                <InputError message={errors.parent_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="is_active">Status</Label>
                <select
                    id="is_active"
                    name="is_active"
                    defaultValue={account?.is_active === false ? '0' : '1'}
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
