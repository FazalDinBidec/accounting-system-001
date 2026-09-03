import { Link, useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import type { SubmitEvent } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import SaleOrderController from '@/actions/App/Http/Controllers/SaleOrderController';
import FormSelect from '@/components/form-select';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { dateInputValue, formatMoney, formatQty, toMoneyNumber } from '@/pages/sales/types';
import type { AvailableBatch, SaleBatchAllocation, SaleOption, SaleOrder } from '@/pages/sales/types';

type FormItem = {
    product_id: string;
    quantity: string;
    unit_price: string;
    batches: SaleBatchAllocation[];
};

function emptyItem(): FormItem {
    return {
        product_id: '',
        quantity: '1',
        unit_price: '0',
        batches: [],
    };
}

function emptyBatch(): SaleBatchAllocation {
    return {
        product_batch_id: 0,
        batch_no: '',
        quantity: '',
    };
}

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function mapItemFromSale(item: NonNullable<SaleOrder['items']>[number]): FormItem {
    return {
        product_id: String(item.product_id),
        quantity: item.quantity,
        unit_price: item.unit_price,
        batches:
            item.batches?.map((batch) => ({
                product_batch_id: batch.product_batch_id,
                batch_no: batch.batch_no,
                quantity: batch.quantity,
            })) ?? [],
    };
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
    const [availableByLine, setAvailableByLine] = useState<Record<number, AvailableBatch[]>>({});
    const suggestTimeout = useRef<number | null>(null);

    const { data, setData, post, put, processing, errors, transform } = useForm({
        party_id: sale ? String(sale.party_id) : '',
        date: sale ? dateInputValue(sale.date) : todayDate(),
        notes: sale?.notes ?? '',
        other_charges: sale?.other_charges ?? '0.00',
        items: sale?.items?.map((item) => mapItemFromSale(item)) ?? [emptyItem()],
    });

    const subtotal = data.items.reduce(
        (sum, item) => sum + toMoneyNumber(item.quantity) * toMoneyNumber(item.unit_price),
        0,
    );
    const otherCharges = toMoneyNumber(data.other_charges);
    const totalAmount = subtotal + otherCharges;

    const loadAvailableBatches = useCallback(
        async (index: number, productId: string): Promise<void> => {
            if (productId === '') {
                return;
            }

            const query: Record<string, string> = {
                product_id: productId,
                available_only: '1',
            };

            if (sale) {
                query.sale_id = String(sale.id);
            }

            const response = await fetch(SaleOrderController.suggestBatches.url({ query }), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as {
                available: AvailableBatch[];
            };

            setAvailableByLine((current) => ({
                ...current,
                [index]: payload.available,
            }));
        },
        [sale],
    );

    const loadBatchSuggestions = useCallback(
        async (index: number, productId: string, quantity: string): Promise<void> => {
            if (productId === '' || toMoneyNumber(quantity) <= 0) {
                return;
            }

            const query: Record<string, string> = {
                product_id: productId,
                quantity,
            };

            if (sale) {
                query.sale_id = String(sale.id);
            }

            const response = await fetch(SaleOrderController.suggestBatches.url({ query }), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as {
                suggested: SaleBatchAllocation[];
                available: AvailableBatch[];
            };

            setAvailableByLine((current) => ({
                ...current,
                [index]: payload.available,
            }));

            setData((current) => ({
                ...current,
                items: current.items.map((item, itemIndex) =>
                    itemIndex === index
                        ? {
                              ...item,
                              batches: payload.suggested.map((batch) => ({
                                  product_batch_id: batch.product_batch_id,
                                  batch_no: batch.batch_no,
                                  quantity: batch.quantity,
                              })),
                          }
                        : item,
                ),
            }));
        },
        [sale, setData],
    );

    useEffect(() => {
        if (!sale?.items) {
            return;
        }

        sale.items.forEach((item, index) => {
            void loadAvailableBatches(index, String(item.product_id));
        });
    }, [loadAvailableBatches, sale?.items]);

    useEffect(() => {
        data.items.forEach((item, index) => {
            if (item.product_id === '' || item.batches.length > 0) {
                return;
            }

            if (toMoneyNumber(item.quantity) <= 0) {
                return;
            }

            void loadBatchSuggestions(index, item.product_id, item.quantity);
        });
    }, [data.items, loadBatchSuggestions]);

    function updateItem(index: number, field: 'product_id' | 'quantity' | 'unit_price', value: string): void {
        setData(
            'items',
            data.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const next = { ...item, [field]: value };

                if (field === 'product_id' || field === 'quantity') {
                    next.batches = [];
                }

                return next;
            }),
        );

        if (field === 'product_id' || field === 'quantity') {
            const productId = field === 'product_id' ? value : data.items[index].product_id;
            const quantity = field === 'quantity' ? value : data.items[index].quantity;

            if (suggestTimeout.current !== null) {
                window.clearTimeout(suggestTimeout.current);
            }

            suggestTimeout.current = window.setTimeout(() => {
                void loadAvailableBatches(index, productId);
                void loadBatchSuggestions(index, productId, quantity);
            }, 300);
        }
    }

    function updateBatch(
        itemIndex: number,
        batchIndex: number,
        field: 'product_batch_id' | 'quantity',
        value: string,
    ): void {
        setData(
            'items',
            data.items.map((item, index) => {
                if (index !== itemIndex) {
                    return item;
                }

                return {
                    ...item,
                    batches: item.batches.map((batch, currentBatchIndex) => {
                        if (currentBatchIndex !== batchIndex) {
                            return batch;
                        }

                        if (field === 'product_batch_id') {
                            const available = availableByLine[itemIndex] ?? [];
                            const match = available.find((option) => String(option.product_batch_id) === value);

                            return {
                                product_batch_id: Number(value),
                                batch_no: match?.batch_no ?? batch.batch_no,
                                quantity: batch.quantity,
                            };
                        }

                        return { ...batch, quantity: value };
                    }),
                };
            }),
        );
    }

    function addBatchRow(itemIndex: number): void {
        setData(
            'items',
            data.items.map((item, index) =>
                index === itemIndex ? { ...item, batches: [...item.batches, emptyBatch()] } : item,
            ),
        );
    }

    function removeBatchRow(itemIndex: number, batchIndex: number): void {
        setData(
            'items',
            data.items.map((item, index) =>
                index === itemIndex
                    ? {
                          ...item,
                          batches: item.batches.filter((_, currentIndex) => currentIndex !== batchIndex),
                      }
                    : item,
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

    function allocatedTotal(batches: SaleBatchAllocation[]): number {
        return batches.reduce((sum, batch) => sum + toMoneyNumber(batch.quantity), 0);
    }

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        transform((formData) => ({
            ...formData,
            items: formData.items.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                batches: item.batches.map((batch) => ({
                    product_batch_id: batch.product_batch_id,
                    quantity: batch.quantity,
                })),
            })),
        }));

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
                    <Heading title={isEditing ? 'Edit Sale' : 'Create New Sale'} />
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
                                        onValueChange={(value) => setData('party_id', value)}
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
                                        onChange={(event) => setData('date', event.target.value)}
                                    />
                                    <InputError message={errors.date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(event) => setData('notes', event.target.value)}
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
                                            <TableHead className="w-[40%]">Product</TableHead>
                                            <TableHead className="w-[calc((100%-40%-3rem)/3)]">Quantity</TableHead>
                                            <TableHead className="w-[calc((100%-40%-3rem)/3)]">Price</TableHead>
                                            <TableHead className="w-[calc((100%-40%-3rem)/3)] text-center whitespace-normal">
                                                Total Amount
                                            </TableHead>
                                            <TableHead className="w-12 text-center">
                                                <span className="sr-only">Action</span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.items.map((item, index) => {
                                            const batchOptions = (availableByLine[index] ?? []).map((batch) => ({
                                                value: String(batch.product_batch_id),
                                                label: `${batch.batch_no} (${formatQty(batch.quantity_on_hand)})`,
                                            }));

                                            return (
                                                <Fragment key={index}>
                                                    <TableRow>
                                                        <TableCell className="min-w-0 align-top">
                                                            <FormSelect
                                                                value={item.product_id}
                                                                onValueChange={(value) =>
                                                                    updateItem(index, 'product_id', value)
                                                                }
                                                                placeholder="Select product..."
                                                                options={products.map((product) => ({
                                                                    value: String(product.id),
                                                                    label: `${product.name} (${formatMoney(product.on_hand)})`,
                                                                }))}
                                                            />
                                                            <InputError message={errors[`items.${index}.product_id`]} />
                                                        </TableCell>
                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="0.01"
                                                                step="0.01"
                                                                value={item.quantity}
                                                                onChange={(event) =>
                                                                    updateItem(index, 'quantity', event.target.value)
                                                                }
                                                            />
                                                            <InputError message={errors[`items.${index}.quantity`]} />
                                                        </TableCell>
                                                        <TableCell className="align-top">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(event) =>
                                                                    updateItem(index, 'unit_price', event.target.value)
                                                                }
                                                            />
                                                            <InputError message={errors[`items.${index}.unit_price`]} />
                                                        </TableCell>
                                                        <TableCell className="text-center align-top font-medium">
                                                            {formatMoney(
                                                                toMoneyNumber(item.quantity) *
                                                                    toMoneyNumber(item.unit_price),
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center align-top">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() => removeItem(index)}
                                                                disabled={data.items.length === 1}
                                                            >
                                                                <Trash2 />
                                                                <span className="sr-only">Remove item</span>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="bg-muted/30">
                                                            <div className="space-y-2 py-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="text-sm font-medium">
                                                                        Batch allocation
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Allocated:{' '}
                                                                        {formatQty(allocatedTotal(item.batches))} /{' '}
                                                                        {formatQty(item.quantity)}
                                                                    </p>
                                                                </div>

                                                                {item.batches.length === 0 ? (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Select product and quantity to load FIFO
                                                                        batches.
                                                                    </p>
                                                                ) : (
                                                                    <Table className="table-fixed">
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead className="w-[calc((100%-3rem)/2)]">
                                                                                    Batch
                                                                                </TableHead>
                                                                                <TableHead className="w-[calc((100%-3rem)/2)]">
                                                                                    Qty
                                                                                </TableHead>
                                                                                <TableHead className="w-12" />
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {item.batches.map((batch, batchIndex) => (
                                                                                <TableRow key={batchIndex}>
                                                                                    <TableCell>
                                                                                        <FormSelect
                                                                                            value={
                                                                                                batch.product_batch_id
                                                                                                    ? String(
                                                                                                          batch.product_batch_id,
                                                                                                      )
                                                                                                    : ''
                                                                                            }
                                                                                            onValueChange={(value) =>
                                                                                                updateBatch(
                                                                                                    index,
                                                                                                    batchIndex,
                                                                                                    'product_batch_id',
                                                                                                    value,
                                                                                                )
                                                                                            }
                                                                                            placeholder="Batch"
                                                                                            options={batchOptions}
                                                                                        />
                                                                                        <InputError
                                                                                            message={
                                                                                                errors[
                                                                                                    `items.${index}.batches.${batchIndex}.product_batch_id`
                                                                                                ]
                                                                                            }
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Input
                                                                                            type="number"
                                                                                            min="0.01"
                                                                                            step="0.01"
                                                                                            value={batch.quantity}
                                                                                            onChange={(event) =>
                                                                                                updateBatch(
                                                                                                    index,
                                                                                                    batchIndex,
                                                                                                    'quantity',
                                                                                                    event.target.value,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                        <InputError
                                                                                            message={
                                                                                                errors[
                                                                                                    `items.${index}.batches.${batchIndex}.quantity`
                                                                                                ]
                                                                                            }
                                                                                        />
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="destructive"
                                                                                            size="icon"
                                                                                            className="size-8"
                                                                                            onClick={() =>
                                                                                                removeBatchRow(
                                                                                                    index,
                                                                                                    batchIndex,
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <Trash2 />
                                                                                        </Button>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                )}

                                                                <InputError
                                                                    message={errors[`items.${index}.batches`]}
                                                                />

                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => addBatchRow(index)}
                                                                >
                                                                    <Plus />
                                                                    Add batch row
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </Fragment>
                                            );
                                        })}
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
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">{formatMoney(subtotal)}</span>
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
                                            onChange={(event) => setData('other_charges', event.target.value)}
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
                                <Link href={SaleOrderController.index.url()}>Cancel</Link>
                            </Button>
                            <Button disabled={processing}>Save Sale</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
