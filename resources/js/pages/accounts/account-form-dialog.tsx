import { Form } from '@inertiajs/react';
import AccountController from '@/actions/App/Http/Controllers/AccountController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AccountFormFields from '@/pages/accounts/account-form-fields';
import type { Account, AccountParentOption } from '@/pages/accounts/types';

export default function AccountFormDialog({
    account,
    parents,
    open,
    onOpenChange,
}: {
    account?: Account;
    parents: AccountParentOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = account !== undefined;
    const parentOptions = isEditing ? parents.filter((parent) => parent.id !== account.id) : parents;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit account' : 'Create account'}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? 'Update this account. Parent is optional.' : 'Add an account. Parent is optional.'}
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...(isEditing ? AccountController.update.form(account) : AccountController.store.form())}
                    className="space-y-6"
                    options={{
                        preserveScroll: true,
                        preserveState: true,
                    }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors, resetAndClearErrors }) => (
                        <>
                            <AccountFormFields account={account} parents={parentOptions} errors={errors} />

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" onClick={() => resetAndClearErrors()}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button disabled={processing}>Save</Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
