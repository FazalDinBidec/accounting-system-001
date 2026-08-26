import { Form, Head, Link } from '@inertiajs/react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import CategoryFormFields from '@/pages/categories/category-form-fields';
import type { CategoryParentOption } from '@/pages/categories/types';

export default function CategoriesCreate({
    parents,
}: {
    parents: CategoryParentOption[];
}) {
    return (
        <>
            <Head title="Create category" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Create category"
                    description="Add a category. Parent is optional."
                />

                <Form
                    {...CategoryController.store.form()}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <CategoryFormFields
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

CategoriesCreate.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: CategoryController.index(),
        },
        {
            title: 'Create',
            href: CategoryController.create(),
        },
    ],
};
