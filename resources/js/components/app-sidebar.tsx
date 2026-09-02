import { Link } from '@inertiajs/react';
import {
    FileChartColumn,
    Receipt,
    Landmark,
    LayoutGrid,
    Package,
    ShoppingBag,
    ShoppingCart,
    Undo2,
    // Tags,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as accounts } from '@/routes/accounts';
// import { index as categories } from '@/routes/categories';
import { index as parties } from '@/routes/parties';
import { index as products } from '@/routes/products';
import { index as purchases } from '@/routes/purchases';
import { generalLedger, partyLedger, trialBalance } from '@/routes/reports';
import { index as saleReturns } from '@/routes/sale-returns';
import { index as sales } from '@/routes/sales';
import { index as stock } from '@/routes/stock';
import { index as vouchers } from '@/routes/vouchers';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    // {
    //     title: 'Categories',
    //     href: categories(),
    //     icon: Tags,
    // },
    {
        title: 'Products',
        href: products(),
        icon: Package,
    },
    {
        title: 'Purchases',
        href: purchases(),
        icon: ShoppingCart,
    },
    {
        title: 'Sales',
        href: sales(),
        icon: ShoppingBag,
    },
    {
        title: 'Sale Returns',
        href: saleReturns(),
        icon: Undo2,
    },
    {
        title: 'Vouchers',
        href: vouchers(),
        icon: Receipt,
    },
    {
        title: 'Stock',
        href: stock(),
        icon: Warehouse,
    },
    {
        title: 'Parties',
        href: parties(),
        icon: Users,
    },
    {
        title: 'Accounts',
        href: accounts(),
        icon: Landmark,
    },
    {
        title: 'Reports',
        icon: FileChartColumn,
        items: [
            {
                title: 'Party Ledger',
                href: partyLedger(),
            },
            {
                title: 'General Ledger',
                href: generalLedger(),
            },
            {
                title: 'Trial Balance',
                href: trialBalance(),
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
