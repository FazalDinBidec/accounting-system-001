import { Form, Head, Link } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PaginatedCategories } from '@/pages/categories/types';

export default function CategoriesIndex({
    categories,
}: {
    categories: PaginatedCategories;
}) {
    return (
        <>
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title="Categories"
                        description="Manage categories"
                    />
                    <Button asChild>
                        <Link href={CategoryController.create()}>
                            Add category
                        </Link>
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    {categories.data.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">
                            No categories yet.
                        </p>
                    ) : (
                        <>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Parent
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.data.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-4 py-3">
                                                {category.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {category.parent?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        category.status ===
                                                        'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {category.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="size-8"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={CategoryController.edit(
                                                                category,
                                                            )}
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Link>
                                                    </Button>
                                                    <Form
                                                        {...CategoryController.destroy.form(
                                                            category,
                                                        )}
                                                        onSubmit={(event) => {
                                                            if (
                                                                !confirm(
                                                                    'Delete this category?',
                                                                )
                                                            ) {
                                                                event.preventDefault();
                                                            }
                                                        }}
                                                    >
                                                        {({ processing }) => (
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="size-8"
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                <Trash2 />
                                                                <span className="sr-only">
                                                                    Delete
                                                                </span>
                                                            </Button>
                                                        )}
                                                    </Form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Pagination
                                links={categories.links}
                                from={categories.from}
                                to={categories.to}
                                total={categories.total}
                                lastPage={categories.last_page}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Categories',
            href: CategoryController.index(),
        },
    ],
};
