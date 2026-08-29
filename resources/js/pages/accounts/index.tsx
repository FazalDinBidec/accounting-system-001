import { Form, Head } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
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
import AccountFormDialog from '@/pages/accounts/account-form-dialog';
import { accountTypeLabels } from '@/pages/accounts/types';
import type {
    Account,
    AccountParentOption,
    PaginatedAccounts,
} from '@/pages/accounts/types';

export default function AccountsIndex({
    accounts,
    parents,
}: {
    accounts: PaginatedAccounts;
    parents: AccountParentOption[];
}) {
    const [dialogAccount, setDialogAccount] = useState<Account | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogKey, setDialogKey] = useState(0);
    const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    function openCreate(): void {
        setDialogAccount(null);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openEdit(account: Account): void {
        setDialogAccount(account);
        setDialogKey((key) => key + 1);
        setDialogOpen(true);
    }

    function openDelete(account: Account): void {
        setDeleteAccount(account);
        setDeleteOpen(true);
    }

    return (
        <>
            <Head title="Accounts" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded p-4">
                <Card className="overflow-hidden py-0">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 border-b py-6">
                        <Heading title="Accounts" />
                        <Button onClick={openCreate}>
                            <Plus />
                            Add account
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-0">
                        {accounts.data.length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">
                                No accounts yet.
                            </p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Parent</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {accounts.data.map((account) => (
                                            <TableRow key={account.id}>
                                                <TableCell>
                                                    {account.name}
                                                </TableCell>
                                                <TableCell>
                                                    {
                                                        accountTypeLabels[
                                                            account.type
                                                        ]
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {account.parent?.name ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Form
                                                        {...AccountController.toggleStatus.form(
                                                            account,
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
                                                                    account.is_active
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                                onCheckedChange={() =>
                                                                    submit()
                                                                }
                                                                aria-label={`Toggle status for ${account.name}`}
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
                                                                    account,
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
                                                                    account,
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
                                    links={accounts.links}
                                    from={accounts.from}
                                    to={accounts.to}
                                    total={accounts.total}
                                    lastPage={accounts.last_page}
                                />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AccountFormDialog
                key={dialogKey}
                account={dialogAccount ?? undefined}
                parents={parents}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Delete account"
                description={
                    deleteAccount
                        ? `Delete ${deleteAccount.name}? This cannot be undone.`
                        : 'This cannot be undone.'
                }
                action={
                    deleteAccount
                        ? AccountController.destroy.form(deleteAccount)
                        : undefined
                }
            />
        </>
    );
}

AccountsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Accounts',
            href: AccountController.index(),
        },
    ],
};
