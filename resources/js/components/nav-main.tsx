import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavGroup, NavItem } from '@/types';

function NavMenuItem({ item, isCurrentUrl }: { item: NavItem; isCurrentUrl: (url: string) => boolean }) {
    if (item.items && item.items.length > 0) {
        return (
            <Collapsible
                asChild
                defaultOpen={item.items.some((child) => child.href !== undefined && isCurrentUrl(child.href))}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={{ children: item.title }}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((child) =>
                                child.href === undefined ? null : (
                                    <SidebarMenuSubItem key={child.title}>
                                        <SidebarMenuSubButton asChild isActive={isCurrentUrl(child.href)}>
                                            <Link href={child.href} prefetch>
                                                <span>{child.title}</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ),
                            )}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    if (item.href === undefined) {
        return null;
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }}>
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            {groups.map((group, index) => (
                <Fragment key={group.label ?? `group-${index}`}>
                    {index > 0 ? <SidebarSeparator className="mx-0" /> : null}
                    <SidebarGroup className="px-2 py-0">
                        {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <NavMenuItem key={item.title} item={item} isCurrentUrl={isCurrentUrl} />
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </Fragment>
            ))}
        </>
    );
}
