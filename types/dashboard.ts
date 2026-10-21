import type { PaymentInstallmentView } from './payment';

export interface DashboardSummary {
  contractCount: number;
  activeContractCount: number;
  totalValue: number;
  paidAmount: number;
  remainingAmount: number;
  paidPercent: number;
  nextInstallment: PaymentInstallmentView | null;
  overdueInstallments: PaymentInstallmentView[];
}
