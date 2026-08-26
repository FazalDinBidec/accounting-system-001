import { Form } from '@inertiajs/react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
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
import CategoryFormFields from '@/pages/categories/category-form-fields';
import type { Category, CategoryParentOption } from '@/pages/categories/types';

export default function CategoryFormDialog({
    category,
    parents,
    open,
    onOpenChange,
}: {
    category?: Category;
    parents: CategoryParentOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = category !== undefined;
    const parentOptions = isEditing
        ? parents.filter((parent) => parent.id !== category.id)
        : parents;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit category' : 'Create category'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update this category. Parent is optional.'
                            : 'Add a category. Parent is optional.'}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(isEditing
                        ? CategoryController.update.form(category)
                        : CategoryController.store.form())}
                    className="space-y-6"
                    options={{
                        preserveScroll: true,
                        preserveState: true,
                    }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors, resetAndClearErrors }) => (
                        <>
                            <CategoryFormFields
                                category={category}
                                parents={parentOptions}
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
