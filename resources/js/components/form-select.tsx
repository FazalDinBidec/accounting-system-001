import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const EMPTY_VALUE = '__empty__';

export default function FormSelect({
    name,
    id,
    defaultValue = '',
    value: valueProp,
    onValueChange,
    placeholder,
    emptyLabel,
    options,
}: {
    name?: string;
    id?: string;
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    emptyLabel?: string;
    options: { value: string; label: string }[];
}) {
    const allowEmpty = emptyLabel !== undefined;
    const isControlled = valueProp !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue === '' && allowEmpty ? EMPTY_VALUE : defaultValue);

    const rawValue = isControlled ? valueProp : internalValue;
    const selectValue = rawValue === '' ? (allowEmpty ? EMPTY_VALUE : undefined) : rawValue;

    function handleChange(next: string): void {
        const submitted = next === EMPTY_VALUE ? '' : next;

        if (!isControlled) {
            setInternalValue(next);
        }

        onValueChange?.(submitted);
    }

    return (
        <>
            {name ? (
                <Input
                    type="hidden"
                    name={name}
                    value={selectValue === EMPTY_VALUE || selectValue === undefined ? '' : selectValue}
                />
            ) : null}
            <Select value={selectValue} onValueChange={handleChange}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {allowEmpty ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </>
    );
}
