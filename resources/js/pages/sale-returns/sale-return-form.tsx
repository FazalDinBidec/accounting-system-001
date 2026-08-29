import { Link, useForm, useHttp } from '@inertiajs/react';
import type { SubmitEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import SaleReturnController from '@/actions/App/Http/Controllers/SaleReturnController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import SearchableSelect from '@/components/searchable-select';
import type { SearchableOption } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    todayDate,
    toMoneyNumber,
} from '@/pages/sale-returns/types';
import type { ReturnableSale, SaleReturn } from '@/pages/sale-returns/types';

type FormItem = {
    sale_order_item_id: number;
    selected: boolean;
    quantity: string;
};

type SaleSearchResult = {
    id: number;
    number: string;
    party_name: string;
};

function initialItems(
    sale: ReturnableSale | null,
    saleReturn?: SaleReturn,
): FormItem[] {
    if (sale === null) {
        return [];
    }

    const quantityByItem = new Map(
        (saleReturn?.items ?? []).map((item) => [
            item.sale_order_item_id,
            item.quantity,
        ]),
    );

    return sale.items.map((item) => {
        const quantity = quantityByItem.get(item.sale_order_item_id);

        return {
            sale_order_item_id: item.sale_order_item_id,
            selected: quantity !== undefined,
            quantity: quantity ?? '',
        };
    });
}

export default function SaleReturnForm({
    sale: initialSale,
    saleReturn,
}: {
    sale: ReturnableSale | null;
    saleReturn?: SaleReturn;
}) {
    const isEditing = saleReturn !== undefined;
    const [sale, setSale] = useState<ReturnableSale | null>(initialSale);
    const { data, setData, post, put, processing, errors, transform } = useForm(
        {
            sale_id: initialSale ? String(initialSale.id) : '',
            date: saleReturn ? dateInputValue(saleReturn.date) : todayDate(),
            notes: saleReturn?.notes ?? '',
            items: initialItems(initialSale, saleReturn),
        },
    );
    const saleSearch = useHttp<{ q: string }, SaleSearchResult[]>({ q: '' });
    const saleLookup = useHttp<Record<string, never>, ReturnableSale>({});
    const saleSearchRef = useRef(saleSearch);
    saleSearchRef.current = saleSearch;

    transform((form) => ({
        sale_id: form.sale_id,
        date: form.date,
        notes: form.notes,
        items: form.items.map((item) => ({
            sale_order_item_id: item.sale_order_item_id,
            quantity: item.selected ? item.quantity : '0',
        })),
    }));

    const searchSales = useCallback(
        async (query: string): Promise<SearchableOption[]> => {
            const http = saleSearchRef.current;
            http.setData('q', query);
            const results = await http.get(
                SaleReturnController.searchSales.url({
                    query: { q: query },
                }),
            );

            return (results ?? []).map((result) => ({
                value: String(result.id),
                label: `${result.number} — ${result.party_name}`,
            }));
        },
        [],
    );

    const saleItemsById = new Map(
        (sale?.items ?? []).map((item) => [item.sale_order_item_id, item]),
    );

    const totalAmount = data.items.reduce((sum, item) => {
        if (!item.selected) {
            return sum;
        }

        const saleItem = saleItemsById.get(item.sale_order_item_id);

        if (saleItem === undefined) {
            return sum;
        }

        return (
            sum +
            toMoneyNumber(item.quantity) * toMoneyNumber(saleItem.unit_price)
        );
    }, 0);

    function applySale(nextSale: ReturnableSale): void {
        setSale(nextSale);
        setData((current) => ({
            ...current,
            sale_id: String(nextSale.id),
            items: initialItems(nextSale),
        }));
    }

    async function selectSale(
        value: string,
        option: SearchableOption,
    ): Promise<void> {
        const nextSale = await saleLookup.get(
            SaleReturnController.lookup.url(Number(value)),
        );

        if (nextSale) {
            applySale(nextSale);

            return;
        }

        setData('sale_id', value);
        setSale({
            id: Number(value),
            number: option.label,
            date: todayDate(),
            party: null,
            items: [],
        });
    }

    function updateItem(
        index: number,
        field: keyof FormItem,
        value: boolean | string,
    ): void {
        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    }

    function toggleItem(index: number, selected: boolean): void {
        const current = data.items[index];
        const saleItem = saleItemsById.get(current.sale_order_item_id);

        setData(
            'items',
            data.items.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                          ...item,
                          selected,
                          quantity:
                              selected && item.quantity === ''
                                  ? (saleItem?.remaining_qty ?? '')
                                  : item.quantity,
                      }
                    : item,
            ),
        );
    }

    function submit(event: SubmitEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (isEditing && saleReturn) {
            put(SaleReturnController.update.url(saleReturn));

            return;
        }

        post(SaleReturnController.store.url());
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
            <div className="rounded border p-4">
                <Heading
                    title={
                        isEditing
                            ? 'Edit Sale Return'
                            : 'Create New Sale Return'
                    }
                />
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4 rounded border p-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="grid gap-2">
                            <Label htmlFor="sale_id">Sale</Label>
                            <SearchableSelect
                                id="sale_id"
                                value={data.sale_id}
                                displayLabel={sale?.number}
                                placeholder="Select Sale..."
                                disabled={isEditing}
                                onSearch={searchSales}
                                onValueChange={(value, option) => {
                                    void selectSale(value, option);
                                }}
                            />
                            <InputError message={errors.sale_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="party">Party</Label>
                            <Input
                                id="party"
                                value={sale?.party?.name ?? ''}
                                readOnly
                                placeholder="Party"
                            />
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

                {sale ? (
                    <div className="space-y-4 rounded border p-4">
                        <h3 className="text-base font-semibold">
                            Return Items
                        </h3>

                        <div className="overflow-x-auto rounded border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center">
                                            -
                                        </TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Sold</TableHead>
                                        <TableHead>Returned</TableHead>
                                        <TableHead>Remaining</TableHead>
                                        <TableHead className="w-32">
                                            Qty
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Amount
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.items.map((saleItem, index) => {
                                        const item = data.items[index];
                                        const remaining = toMoneyNumber(
                                            saleItem.remaining_qty,
                                        );
                                        const disabled =
                                            remaining <= 0 && !item?.selected;

                                        return (
                                            <TableRow
                                                key={
                                                    saleItem.sale_order_item_id
                                                }
                                            >
                                                <TableCell className="text-center">
                                                    <Checkbox
                                                        checked={
                                                            item?.selected ??
                                                            false
                                                        }
                                                        disabled={disabled}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            toggleItem(
                                                                index,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {saleItem.product_name}
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(
                                                        saleItem.sold_qty,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(
                                                        saleItem.returned_qty,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatMoney(
                                                        saleItem.remaining_qty,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        max={
                                                            saleItem.remaining_qty
                                                        }
                                                        value={
                                                            item?.quantity ?? ''
                                                        }
                                                        disabled={
                                                            !item?.selected
                                                        }
                                                        onChange={(event) =>
                                                            updateItem(
                                                                index,
                                                                'quantity',
                                                                event.target
                                                                    .value,
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
                                                <TableCell className="text-right font-medium">
                                                    {item?.selected
                                                        ? formatMoney(
                                                              toMoneyNumber(
                                                                  item.quantity,
                                                              ) *
                                                                  toMoneyNumber(
                                                                      saleItem.unit_price,
                                                                  ),
                                                          )
                                                        : formatMoney(0)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <InputError message={errors.items} />

                        <div className="flex justify-end text-base font-semibold">
                            <div className="flex w-full max-w-sm items-center justify-between gap-4">
                                <span>Total Amount</span>
                                <span>{formatMoney(totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                ) : null}

                <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" asChild>
                        <Link href={SaleReturnController.index.url()}>
                            Cancel
                        </Link>
                    </Button>
                    <Button disabled={processing}>Save Return</Button>
                </div>
            </form>
        </div>
    );
}
