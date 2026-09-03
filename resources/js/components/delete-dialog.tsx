import { Form } from '@inertiajs/react';
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
import type { RouteFormDefinition } from '@/wayfinder';

export default function DeleteDialog({
    open,
    onOpenChange,
    title = 'Delete',
    description = 'This cannot be undone.',
    action,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    action?: RouteFormDefinition<'get' | 'post'>;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {action ? (
                    <Form
                        {...action}
                        options={{
                            preserveScroll: true,
                        }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing }) => (
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button variant="destructive" disabled={processing}>
                                    Yes
                                </Button>
                            </DialogFooter>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
