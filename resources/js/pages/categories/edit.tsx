import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import CategoryFormFields from '@/pages/categories/category-form-fields';
import type { Category, CategoryParentOption } from '@/pages/categories/types';

export default function CategoriesEdit({
    category,
    parents,
}: {
    category: Category;
    parents: CategoryParentOption[];
}) {
    setLayoutProps({
        breadcrumbs: [
            {
                title: 'Categories',
                href: CategoryController.index(),
            },
            {
                title: 'Edit',
                href: CategoryController.edit(category),
            },
        ],
    });

    return (
        <>
            <Head title="Edit category" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Edit category"
                    description="Update this category. Parent is optional."
                />

                <Form
                    {...CategoryController.update.form(category)}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <CategoryFormFields
                                category={category}
                                parents={parents}
                                errors={errors}
                            />

                            <div className="flex items-center gap-2">
                                <Button disabled={processing}>Save</Button>
                                <Button variant="outline" asChild>
                                    <Link href={CategoryController.index()}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
