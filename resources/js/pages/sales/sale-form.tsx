import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { SubmitEvent } from 'react';
import SaleOrderController from '@/actions/App/Http/Controllers/SaleOrderController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
} from '@/pages/sales/types';
import type { SaleOption, SaleOrder } from '@/pages/sales/types';

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

export default function SaleForm({
    sale,
    parties,
    products,
}: {
    sale?: SaleOrder;
    parties: SaleOption[];
    products: SaleOption[];
}) {
    const isEditing = sale !== undefined;
    const { data, setData, post, put, processing, errors } = useForm({
        party_id: sale ? String(sale.party_id) : '',
        date: sale ? dateInputValue(sale.date) : todayDate(),
        notes: sale?.notes ?? '',
        other_charges: sale?.other_charges ?? '0.00',
        items:
            sale?.items?.map((item) => ({
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

        if (isEditing && sale) {
            put(SaleOrderController.update.url(sale));

            return;
        }

        post(SaleOrderController.store.url());
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <Card className="overflow-hidden py-0">
                <CardHeader className="border-b py-6">
                    <Heading
                        title={isEditing ? 'Edit Sale' : 'Create New Sale'}
                    />
                </CardHeader>
                <CardContent className="py-6">
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4 rounded border p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="party_id">Party (Customer)</Label>
                            <FormSelect
                                id="party_id"
                                value={data.party_id}
                                onValueChange={(value) =>
                                    setData('party_id', value)
                                }
                                placeholder="Select Customer..."
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
                    <h3 className="text-base font-semibold">Sale Items</h3>

                    <div className="overflow-hidden rounded border">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50%]">
                                        Product
                                    </TableHead>
                                    <TableHead className="w-[calc((100%-50%-3rem)/3)]">
                                        Quantity
                                    </TableHead>
                                    <TableHead className="w-[calc((100%-50%-3rem)/3)]">
                                        Price
                                    </TableHead>
                                    <TableHead className="w-[calc((100%-50%-3rem)/3)] text-center whitespace-normal">
                                        Total Amount
                                    </TableHead>
                                    <TableHead className="w-12 text-center">
                                        <span className="sr-only">Action</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="min-w-0">
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
                                                        label: `${product.name} (${formatMoney(product.on_hand)})`,
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
                                        <TableCell className="text-center font-medium">
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
                        <Link href={SaleOrderController.index.url()}>
                            Cancel
                        </Link>
                    </Button>
                    <Button disabled={processing}>Save Sale</Button>
                </div>
            </form>
                </CardContent>
            </Card>
        </div>
    );
}
