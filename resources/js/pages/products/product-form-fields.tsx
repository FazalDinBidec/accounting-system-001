import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/pages/products/types';

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
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={product?.description ?? ''}
                    placeholder="Optional description"
                    className="min-h-24"
                />
                <InputError message={errors.description} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="is_active">Status</Label>
                <FormSelect
                    id="is_active"
                    name="is_active"
                    defaultValue={product?.is_active === false ? '0' : '1'}
                    options={[
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' },
                    ]}
                />
                <InputError message={errors.is_active} />
            </div>
        </>
    );
}
