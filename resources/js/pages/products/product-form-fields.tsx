import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/pages/products/types';

const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

const textareaClassName =
    'flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export default function ProductFormFields({
    product,
    errors,
}: {
    product?: Pick<Product, 'name' | 'description' | 'is_active'>;
    errors: Partial<Record<'name' | 'description' | 'is_active', string>>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={product?.name ?? ''}
                    placeholder="Product name"
                    autoFocus
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                    id="description"
                    name="description"
                    defaultValue={product?.description ?? ''}
                    placeholder="Optional description"
                    className={textareaClassName}
                />
                <InputError message={errors.description} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="is_active">Status</Label>
                <select
                    id="is_active"
                    name="is_active"
                    defaultValue={product?.is_active === false ? '0' : '1'}
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
