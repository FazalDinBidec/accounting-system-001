export function formatMoney(value: string | number): string {
    const amount = Number(value);

    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

export function dateInputValue(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    return value.slice(0, 10);
}

export type ReportOption = {
    id: number;
    name: string;
};

export type PartyLedgerRow = {
    id: number;
    date: string;
    type: string;
    reference: string;
    account: string;
    debit: string;
    credit: string;
    receivable: string;
    payable: string;
    net: string;
};

export type PartyLedgerReport = {
    opening: {
        receivable: string;
        payable: string;
        net: string;
    } | null;
    rows: PartyLedgerRow[];
    closing: {
        receivable: string;
        payable: string;
        net: string;
    };
};

export type GeneralLedgerRow = {
    id: number;
    date: string;
    type: string;
    reference: string;
    party: string | null;
    narration: string | null;
    debit: string;
    credit: string;
    balance: string;
};

export type GeneralLedgerReport = {
    opening: string | null;
    rows: GeneralLedgerRow[];
    closing: string;
};

export type TrialBalanceRow = {
    id: number;
    name: string;
    type: string;
    debit: string;
    credit: string;
};

export type TrialBalanceReport = {
    rows: TrialBalanceRow[];
    totals: {
        debit: string;
        credit: string;
    };
};

export type StockBatchReportRow = {
    id: number;
    product_id: number;
    product_name: string;
    batch_no: string;
    quantity_on_hand: string;
    parties: string;
};

export type StockBatchReport = {
    rows: StockBatchReportRow[];
};

export type ProfitAndLossRow = {
    id: number;
    name: string;
    amount: string;
};

export type ProfitAndLossSection = {
    rows: ProfitAndLossRow[];
    total: string;
};

export type ProfitAndLossReport = {
    income: ProfitAndLossSection;
    expenses: ProfitAndLossSection;
    net: string;
    net_label: 'Net Profit' | 'Net Loss';
};

export type BalanceSheetRow = {
    id: number;
    name: string;
    amount: string;
    party_name?: string | null;
};

export type BalanceSheetReport = {
    assets: { rows: BalanceSheetRow[]; total: string };
    liabilities: { rows: BalanceSheetRow[]; total: string };
    equity: { rows: BalanceSheetRow[]; total: string };
    totals: { liabilities_and_equity: string };
};

export type CapitalSummaryRow = {
    party_id: number;
    party_name: string;
    allocated: string;
    withdrawn: string;
    balance: string;
};

export type CapitalSummaryReport = {
    rows: CapitalSummaryRow[];
    totals: {
        allocated: string;
        withdrawn: string;
        balance: string;
    };
};

export function displayAmount(value: string): string {
    if (value === '0.00' || value === '0') {
        return '—';
    }

    return formatMoney(value);
}
