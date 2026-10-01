import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { summarizeContractPayments, toInstallmentView } from '@/lib/payment';
import type { Contract, ContractFilter, ContractListItem, PaymentInstallmentView } from '@/types';

import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';

export interface ContractDetail {
  contract: ContractListItem;
  installments: PaymentInstallmentView[];
}

const typeOrder: Record<Contract['type'], number> = { purchase: 0, deposit: 1, reservation: 2 };

function buildInstallmentViews(contract: Contract): PaymentInstallmentView[] {
  return mockInstallments
    .filter((i) => i.contractId === contract.id)
    .sort((a, b) => a.sequence - b.sequence)
    .map((i) => toInstallmentView(i, contract));
}

function toListItem(contract: Contract): ContractListItem {
  return { ...clone(contract), summary: summarizeContractPayments(contract, buildInstallmentViews(contract)) };
}

function matchesFilter(contract: Contract, filter: ContractFilter): boolean {
  if (filter.status && filter.status !== 'all' && contract.status !== filter.status) return false;
  if (filter.type && filter.type !== 'all' && contract.type !== filter.type) return false;
  const keyword = filter.search?.trim().toLowerCase();
  if (keyword) {
    const haystack = `${contract.code} ${contract.unitCode} ${contract.projectName}`.toLowerCase();
    if (!haystack.includes(keyword)) return false;
  }
  return true;
}

export async function getContracts(filter: ContractFilter = {}): Promise<ContractListItem[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts?status=&type=&q=)
  await simulateLatency();
  return mockContracts
    .filter((c) => matchesFilter(c, filter))
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || b.signedDate.localeCompare(a.signedDate))
    .map(toListItem);
}

export async function getContractById(id: string): Promise<ContractDetail> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts/:id)
  await simulateLatency();
  const contract = mockContracts.find((c) => c.id === id);
  if (!contract) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  return { contract: toListItem(contract), installments: buildInstallmentViews(contract) };
}
