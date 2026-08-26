import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category, CategoryParentOption } from '@/pages/categories/types';

const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export default function CategoryFormFields({
    category,
    parents,
    errors,
}: {
    category?: Pick<Category, 'name' | 'status' | 'parent_id'>;
    parents: CategoryParentOption[];
    errors: Partial<Record<'name' | 'status' | 'parent_id', string>>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={category?.name ?? ''}
                    placeholder="Category name"
                    autoFocus
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="parent_id">Parent</Label>
                <select
                    id="parent_id"
                    name="parent_id"
                    defaultValue={category?.parent_id ?? ''}
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
                <Label htmlFor="status">Status</Label>
                <select
                    id="status"
                    name="status"
                    defaultValue={category?.status ?? 'active'}
                    className={selectClassName}
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <InputError message={errors.status} />
            </div>
        </>
    );
}
