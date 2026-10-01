import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { countContractsByStatus, matchesContractCode, matchesContractFilter } from '@/lib/contract';
import { summarizeContractPayments, toInstallmentView } from '@/lib/payment';
import type { Contract, ContractCounts, ContractFilter, ContractListItem, PaymentInstallmentView } from '@/types';

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

export async function getContracts(filter: ContractFilter = {}): Promise<ContractListItem[]> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts?status=&type=&code=)
  await simulateLatency();
  return mockContracts
    .filter((c) => matchesContractFilter(c, filter))
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || b.signedDate.localeCompare(a.signedDate))
    .map(toListItem);
}

/** Số lượng hợp đồng theo tab (áp dụng cùng từ khóa tìm kiếm). */
export async function getContractCounts(search?: string): Promise<ContractCounts> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts/counts?q=)
  await simulateLatency();
  return countContractsByStatus(mockContracts.filter((c) => matchesContractCode(c, search)));
}

export async function getContractById(id: string): Promise<ContractDetail> {
  // TODO: thay bằng gọi API/database thật (ví dụ GET /contracts/:id)
  await simulateLatency();
  const contract = mockContracts.find((c) => c.id === id);
  if (!contract) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  return { contract: toListItem(contract), installments: buildInstallmentViews(contract) };
}
