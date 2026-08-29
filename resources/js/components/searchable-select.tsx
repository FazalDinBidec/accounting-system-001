import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type SearchableOption = {
    value: string;
    label: string;
};

export default function SearchableSelect({
    id,
    value,
    displayLabel,
    placeholder,
    disabled = false,
    onSearch,
    onValueChange,
}: {
    id?: string;
    value: string;
    displayLabel?: string;
    placeholder?: string;
    disabled?: boolean;
    onSearch: (query: string) => Promise<SearchableOption[]>;
    onValueChange: (value: string, option: SearchableOption) => void;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<SearchableOption[]>([]);
    const [searching, setSearching] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent): void {
            if (
                rootRef.current !== null &&
                !rootRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClick);

        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (!open || disabled) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setSearching(true);
            void onSearch(query)
                .then((results) => setOptions(results))
                .finally(() => setSearching(false));
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [open, query, disabled, onSearch]);

    const shownLabel =
        displayLabel !== undefined && displayLabel !== ''
            ? displayLabel
            : placeholder;

    return (
        <div ref={rootRef} className="relative">
            <button
                id={id}
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded border border-input bg-transparent px-3 py-2 text-left text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                    value === '' && 'text-muted-foreground',
                )}
            >
                <span className="truncate">{shownLabel}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
            </button>

            {open && !disabled ? (
                <div className="absolute z-50 mt-1 w-full rounded border bg-popover p-1 shadow-md">
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search..."
                        className="mb-1 h-8 w-full rounded border border-input bg-transparent px-2 text-sm outline-none"
                    />
                    <div className="max-h-56 overflow-y-auto">
                        {searching && options.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                Loading...
                            </p>
                        ) : options.length === 0 ? (
                            <p className="px-2 py-1.5 text-sm text-muted-foreground">
                                No results.
                            </p>
                        ) : (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        'flex w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent',
                                        option.value === value && 'bg-accent',
                                    )}
                                    onClick={() => {
                                        onValueChange(option.value, option);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
