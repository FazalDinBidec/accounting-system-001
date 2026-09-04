import { Link } from '@inertiajs/react';
import {
    CalendarRange,
    FileChartColumn,
    HandCoins,
    Receipt,
    Scale,
    Landmark,
    LayoutGrid,
    Package,
    ShoppingBag,
    ShoppingCart,
    Undo2,
    Users,
    Wallet,
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
import { index as capital } from '@/routes/capital';
import { index as expenses } from '@/routes/expenses';
import { index as fiscalYears } from '@/routes/fiscal-years';
import { index as openings } from '@/routes/openings';
import { index as parties } from '@/routes/parties';
import { index as products } from '@/routes/products';
import { index as purchases } from '@/routes/purchases';
import {
    balanceSheet,
    capitalSummary,
    generalLedger,
    partyLedger,
    profitAndLoss,
    stockReport,
    trialBalance,
} from '@/routes/reports';
import { index as saleReturns } from '@/routes/sale-returns';
import { index as sales } from '@/routes/sales';
import { index as stock } from '@/routes/stock';
import { index as vouchers } from '@/routes/vouchers';
import type { NavGroup } from '@/types';

const navGroups: NavGroup[] = [
    {
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        label: 'Operations',
        items: [
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
                title: 'Stock',
                href: stock(),
                icon: Warehouse,
            },
        ],
    },
    {
        label: 'Finance',
        items: [
            {
                title: 'Vouchers',
                href: vouchers(),
                icon: Receipt,
            },
            {
                title: 'Expenses',
                href: expenses(),
                icon: Wallet,
            },
            {
                title: 'Opening Balances',
                href: openings(),
                icon: Scale,
            },
            {
                title: 'Capital Tranx',
                href: capital(),
                icon: HandCoins,
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
                    {
                        title: 'Profit & Loss',
                        href: profitAndLoss(),
                    },
                    {
                        title: 'Balance Sheet',
                        href: balanceSheet(),
                    },
                    {
                        title: 'Capital Summary',
                        href: capitalSummary(),
                    },
                    {
                        title: 'Stock Report',
                        href: stockReport(),
                    },
                ],
            },
        ],
    },
    {
        label: 'Management',
        items: [
            {
                title: 'Products',
                href: products(),
                icon: Package,
            },
            {
                title: 'Fiscal Years',
                href: fiscalYears(),
                icon: CalendarRange,
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
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
