import { Form, Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import PartyController from '@/actions/App/Http/Controllers/PartyController';
import DeleteDialog from '@/components/delete-dialog';
import Heading from '@/components/heading';
import Pagination from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import PartyFormDialog from '@/pages/parties/party-form-dialog';
import type { PaginatedParties, Party } from '@/pages/parties/types';

export default function PartiesIndex({
    parties,
}: {
    parties: PaginatedParties;
}) {
    const [dialogParty, setDialogParty] = useState<Party | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);
    const [deleteParty, setDeleteParty] = useState<Party | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate(): void {
        setDialogParty(null);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openEdit(party: Party): void {
        setDialogParty(party);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openDelete(party: Party): void {
        setDeleteParty(party);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Parties" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <div className="flex items-start justify-between gap-4 rounded border p-4">
                    <Heading title="Parties" />
                    <Button onClick={openCreate}>
                        <Plus />
                        Add party
                    </Button>
                </div>

                <div className="overflow-hidden rounded border border-sidebar-border/70 dark:border-sidebar-border">
                    {parties.data.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">
                            No parties yet.
                        </p>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parties.data.map((party) => (
                                        <TableRow key={party.id}>
                                            <TableCell>{party.name}</TableCell>
                                            <TableCell>
                                                {party.phone ?? '—'}
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <span className="line-clamp-2">
                                                    {party.address ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Form
                                                    {...PartyController.toggleStatus.form(
                                                        party,
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
                                                                party.is_active
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            onCheckedChange={() =>
                                                                submit()
                                                            }
                                                            aria-label={`Toggle status for ${party.name}`}
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
                                                            openEdit(party)
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
                                                            openDelete(party)
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
                                links={parties.links}
                                from={parties.from}
                                to={parties.to}
                                total={parties.total}
                                lastPage={parties.last_page}
                            />
                        </>
                    )}
                </div>
            </div>

            <PartyFormDialog
                key={dialogKey}
                party={dialogParty ?? undefined}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete party"
                description={
                    deleteParty
                        ? `Delete ${deleteParty.name}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteParty
                        ? PartyController.destroy.form(deleteParty)
                        : undefined
                }
            />
        </>
    );
}

PartiesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Parties',
            href: PartyController.index(),
        },
    ],
};
