import FormSelect from '@/components/form-select';
import InputError from '@/components/input-error';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import { accountTypeLabels } from '@/pages/accounts/types';
import type {
    Account,
    AccountParentOption,
    AccountType,
} from '@/pages/accounts/types';

const accountTypes = Object.entries(accountTypeLabels)as[AccountType, string,][];

export default function AccountFormFields({account, parents, errors} : {
    account? : Pick < Account,
    'name' | 'type' | 'parent_id' | 'is_active' >;
    parents : AccountParentOption[];
    errors : Partial < Record < 'name' | 'type' | 'parent_id' | 'is_active',
    string >>;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required
                    defaultValue={
                        account ?. name ?? ''
                    }
                    placeholder="Account name"
                    autoFocus/>
                <InputError message={
                    errors.name
                }/>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <FormSelect id="type" name="type"
                    defaultValue={
                        account ?. type ?? 'asset'
                    }
                    options={
                        accountTypes.map(([value, label]) => ({value, label}))
                    }/>
                <InputError message={
                    errors.type
                }/>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="parent_id">Parent</Label>
                <FormSelect id="parent_id" name="parent_id"
                    defaultValue={
                        account ?. parent_id ? String(account.parent_id) : ''
                    }
                    emptyLabel="None"
                    options={
                        parents.map((parent) => ({
                            value: String(parent.id),
                            label: parent.name
                        }))
                    }/>
                <InputError message={
                    errors.parent_id
                }/>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="is_active">Status</Label>
                <FormSelect id="is_active" name="is_active"
                    defaultValue={
                        account ?. is_active === false ? '0' : '1'
                    }
                    options={
                        [
                            {
                                value: '1',
                                label: 'Active'
                            }, {
                                value: '0',
                                label: 'Inactive'
                            },
                        ]
                    }/>
                <InputError message={
                    errors.is_active
                }/>
            </div>
        </>
    );
}
