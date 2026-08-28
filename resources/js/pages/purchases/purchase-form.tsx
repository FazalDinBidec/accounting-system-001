import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { SubmitEvent } from 'react';
import PurchaseOrderController from '@/actions/App/Http/Controllers/PurchaseOrderController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
    dateInputValue,
    formatMoney,
    toMoneyNumber,
} from '@/pages/purchases/types';
import type {
    PurchaseOption,
    PurchaseOrder,
} from '@/pages/purchases/types';

type FormItem = {
    product_id: string;
    quantity: string;
    unit_price: string;
};

function emptyItem(): FormItem {
    return {
        product_id: '',
        quantity: '1',
        unit_price: '0',
    };
}

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

export default function PurchaseForm({
    purchase,
    parties,
    products,
}: {
    purchase?: PurchaseOrder;
    parties: PurchaseOption[];
    products: PurchaseOption[];
}) {
    const isEditing = purchase !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        party_id: purchase ? String(purchase.party_id) : '',
        date: purchase ? dateInputValue(purchase.date) : todayDate(),
        notes: purchase?.notes ?? '',
        other_charges: purchase?.other_charges ?? '0.00',
        items:
            purchase?.items?.map((item) => ({
                product_id: String(item.product_id),
                quantity: item.quantity,
                unit_price: item.unit_price,
            })) ?? [emptyItem()],
    });

    const subtotal = data.items.reduce(
        (sum, item) =>
            sum + toMoneyNumber(item.quantity) * toMoneyNumber(item.unit_price),
        0,
    );
    const otherCharges = toMoneyNumber(data.other_charges);
    const totalAmount = subtotal + otherCharges;

    function updateItem(
        index: number,
        field: keyof FormItem,
        value: string,
    ): void {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function addItem(): void {
        setData('items', [...data.items, emptyItem()]);
    }

    function removeItem(index: number): void {
        setData(
            'items',
            data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    }

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isEditing && purchase) {
            put(PurchaseOrderController.update.url(purchase));

            return;
        }

        post(PurchaseOrderController.store.url());
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <div className="rounded border p-4">
                <Heading
                    title={
                        isEditing ? 'Edit Purchase' : 'Create New Purchase'
                    }
                />
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4 rounded border p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="party_id">Party (Vendor)</Label>
                            <FormSelect
                                id="party_id"
                                value={data.party_id}
                                onValueChange={(value) =>
                                    setData('party_id', value)
                                }
                                placeholder="Select Vendor..."
                                options={parties.map((party) => ({
                                    value: String(party.id),
                                    label: party.name,
                                }))}
                            />
                            <InputError message={errors.party_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(event) =>
                                    setData('date', event.target.value)
                                }
                            />
                            <InputError message={errors.date} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            placeholder="Add any additional notes here..."
                            className="min-h-24"
                        />
                        <InputError message={errors.notes} />
                    </div>
                </div>

                <div className="space-y-4 rounded border p-4">
                    <h3 className="text-base font-semibold">Purchase Items</h3>

                    <div className="overflow-x-auto rounded border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="w-28">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="w-32">Price</TableHead>
                                    <TableHead className="w-36 text-right">
                                        Total Amount
                                    </TableHead>
                                    <TableHead className="w-16 text-center">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <FormSelect
                                                value={item.product_id}
                                                onValueChange={(value) =>
                                                    updateItem(
                                                        index,
                                                        'product_id',
                                                        value,
                                                    )
                                                }
                                                placeholder="Select product..."
                                                options={products.map(
                                                    (product) => ({
                                                        value: String(
                                                            product.id,
                                                        ),
                                                        label: product.name,
                                                    }),
                                                )}
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `items.${index}.product_id`
                                                    ]
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'quantity',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `items.${index}.quantity`
                                                    ]
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'unit_price',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors[
                                                        `items.${index}.unit_price`
                                                    ]
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatMoney(
                                                toMoneyNumber(item.quantity) *
                                                    toMoneyNumber(
                                                        item.unit_price,
                                                    ),
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="size-8"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                disabled={
                                                    data.items.length === 1
                                                }
                                            >
                                                <Trash2 />
                                                <span className="sr-only">
                                                    Remove item
                                                </span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <InputError message={errors.items} />

                    <Button type="button" onClick={addItem}>
                        <Plus />
                        Add Item
                    </Button>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex w-full max-w-sm items-center justify-between gap-4 text-sm">
                            <span className="text-muted-foreground">
                                Subtotal
                            </span>
                            <span className="font-medium">
                                {formatMoney(subtotal)}
                            </span>
                        </div>

                        <div className="flex w-full max-w-sm items-center justify-between gap-4">
                            <Label htmlFor="other_charges">Other Charges</Label>
                            <div className="w-32">
                                <Input
                                    id="other_charges"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.other_charges}
                                    onChange={(event) =>
                                        setData(
                                            'other_charges',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <InputError message={errors.other_charges} />

                        <div className="flex w-full max-w-sm items-center justify-between gap-4 text-base font-semibold">
                            <span>Total Amount</span>
                            <span>{formatMoney(totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" asChild>
                        <Link href={PurchaseOrderController.index.url()}>
                            Cancel
                        </Link>
                    </Button>
                    <Button disabled={processing}>Save Purchase</Button>
                </div>
            </form>
        </div>
    );
}
