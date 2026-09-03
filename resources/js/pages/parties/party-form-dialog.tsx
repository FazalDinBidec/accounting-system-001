import { Form } from '@inertiajs/react';
import PartyController from '@/actions/App/Http/Controllers/PartyController';
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
import PartyFormFields from '@/pages/parties/party-form-fields';
import type { Party } from '@/pages/parties/types';

export default function PartyFormDialog({
    party,
    open,
    onOpenChange,
}: {
    party?: Party;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = party !== undefined;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit party' : 'Create party'}</DialogTitle>
                    <DialogDescription>{isEditing ? 'Update this party.' : 'Add a party.'}</DialogDescription>
                </DialogHeader>

                <Form
                    {...(isEditing ? PartyController.update.form(party) : PartyController.store.form())}
                    className="space-y-6"
                    options={{
                        preserveScroll: true,
                        preserveState: true,
                    }}
                    onSuccess={() => onOpenChange(false)}
                >
                    {({ processing, errors, resetAndClearErrors }) => (
                        <>
                            <PartyFormFields party={party} errors={errors} />

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
