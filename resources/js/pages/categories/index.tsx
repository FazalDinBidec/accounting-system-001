import { Form, Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import CategoryController from '@/actions/App/Http/Controllers/CategoryController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import CategoryFormDialog from '@/pages/categories/category-form-dialog';
import type {
    Category,
    CategoryParentOption,
    PaginatedCategories,
} from '@/pages/categories/types';

export default function CategoriesIndex({
    categories,
    parents,
}: {
    categories: PaginatedCategories;
    parents: CategoryParentOption[];
}) {
    const [dialogCategory, setDialogCategory] = useState<Category | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);
    const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate(): void {
        setDialogCategory(null);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openEdit(category: Category): void {
        setDialogCategory(category);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openDelete(category: Category): void {
        setDeleteCategory(category);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Categories" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Categories" />
                        <Button onClick={openCreate}>
                            <Plus />
                            Add category
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {categories.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                No categories yet.
                            </p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Parent</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.data.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>
                                                    {category.name}
                                                </TableCell>
                                                <TableCell>
                                                    {category.parent?.name ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Form
                                                        {...CategoryController.toggleStatus.form(
                                                            category,
                                                        )}
                                                        options={{
                                                            preserveScroll: true,
                                                        }}
                                                    >
                                                        {({
                                                            processing,
                                                            submit,
                                                        }) => (
                                                            <Switch
                                                                checked={
                                                                    category.status ===
                                                                    'active'
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                                onCheckedChange={() =>
                                                                    submit()
                                                                }
                                                                aria-label={`Toggle status for ${category.name}`}
                                                            />
                                                        )}
                                                    </Form>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openEdit(
                                                                    category,
                                                                )
                                                            }
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Edit
                                                            </span>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="size-8"
                                                            onClick={() =>
                                                                openDelete(
                                                                    category,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">
                                                                Delete
                                                            </span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Pagination
                                    links={categories.links}
                                    from={categories.from}
                                    to={categories.to}
                                    total={categories.total}
                                    lastPage={categories.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CategoryFormDialog
                key={dialogKey}
                category={dialogCategory ?? undefined}
                parents={parents}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete category"
                description={
                    deleteCategory
                        ? `Delete ${deleteCategory.name}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteCategory
                        ? CategoryController.destroy.form(deleteCategory)
                        : undefined
                }
            />
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
