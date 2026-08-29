import { Form, Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProductController from '@/actions/App/Http/Controllers/ProductController';
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
import ProductFormDialog from '@/pages/products/product-form-dialog';
import type { PaginatedProducts, Product } from '@/pages/products/types';

export default function ProductsIndex({
    products,
}: {
    products: PaginatedProducts;
}) {
    const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate(): void {
        setDialogProduct(null);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openEdit(product: Product): void {
        setDialogProduct(product);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openDelete(product: Product): void {
        setDeleteProduct(product);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Products" />
                        <Button onClick={openCreate}>
                            <Plus />
                            Add product
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                    {products.data.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                            No products yet.
                        </p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.data.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <span className="line-clamp-2">
                                                    {product.description ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Form
                                                    {...ProductController.toggleStatus.form(
                                                        product,
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
                                                                product.is_active
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            onCheckedChange={() =>
                                                                submit()
                                                            }
                                                            aria-label={`Toggle status for ${product.name}`}
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
                                                            openEdit(product)
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
                                                            openDelete(product)
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
                                links={products.links}
                                from={products.from}
                                to={products.to}
                                total={products.total}
                                lastPage={products.last_page}
                            />
                        </>
                    )}
                    </CardContent>
                </Card>
            </div>

            <ProductFormDialog
                key={dialogKey}
                product={dialogProduct ?? undefined}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete product"
                description={
                    deleteProduct
                        ? `Delete ${deleteProduct.name}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteProduct
                        ? ProductController.destroy.form(deleteProduct)
                        : undefined
                }
            />
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: ProductController.index(),
        },
    ],
};
