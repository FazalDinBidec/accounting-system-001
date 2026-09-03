import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category, CategoryParentOption } from '@/pages/categories/types';

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
                <FormSelect
                    id="parent_id"
                    name="parent_id"
                    defaultValue={category?.parent_id ? String(category.parent_id) : ''}
                    emptyLabel="None"
                    options={parents.map((parent) => ({
                        value: String(parent.id),
                        label: parent.name,
                    }))}
                />
                <InputError message={errors.parent_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <FormSelect
                    id="status"
                    name="status"
                    defaultValue={category?.status ?? 'active'}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                    ]}
                />
                <InputError message={errors.status} />
            </div>
        </>
    );
}
