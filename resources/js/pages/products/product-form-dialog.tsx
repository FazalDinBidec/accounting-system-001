import { Form } from '@inertiajs/react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ProductFormFields from '@/pages/products/product-form-fields';
import type { Product } from '@/pages/products/types';

export default function ProductFormDialog({
    product,
    open,
    onOpenChange,
}: {
    product?: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = product !== undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit product' : 'Create product'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update this product.'
                            : 'Add a product.'}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(isEditing
                        ? ProductController.update.form(product)
                        : ProductController.store.form())}
                    className="space-y-6"
                    options={{
                        preserveScroll: true,
                        preserveState: true,
                    }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors, resetAndClearErrors }) => (
                        <>
                            <ProductFormFields
                                product={product}
                                errors={errors}
                            />

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => resetAndClearErrors()}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button disabled={processing}>Save</Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
