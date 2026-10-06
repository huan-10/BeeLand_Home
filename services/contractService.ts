import { Asset } from 'expo-asset';

import { mockSeller, mockTermsByType } from '@/data/mock/contractDetails';
import { mockContracts } from '@/data/mock/contracts';
import { mockInstallments } from '@/data/mock/installments';
import { countContractsByStatus, matchesContractFilter, matchesContractSearch } from '@/lib/contract';
import { summarizeContractPayments, toInstallmentView } from '@/lib/payment';
import type {
  Contract,
  ContractCounts,
  ContractDocument,
  ContractFilter,
  ContractListItem,
  ContractParty,
  ContractTerm,
  PaymentInstallmentView,
} from '@/types';

import { AUTH_BACKEND } from './config';
import { isNoxhOnlySession } from './session';
import { ServiceError } from './errors';
import { clone, simulateLatency } from './mockLatency';
import { getSellerCompany } from './supabase/customerData';
import { getContractBundles } from './supabase/customerDomain';

export interface ContractDetail {
  contract: ContractListItem;
  installments: PaymentInstallmentView[];
  seller: ContractParty;
  terms: ContractTerm[];
  /** Tệp hợp đồng; dữ liệu thật chưa có PDF → không hiển thị nút xem. */
  document?: ContractDocument;
}

/** Hợp đồng PDF mẫu đóng gói trong ứng dụng (mock). */
const SAMPLE_CONTRACT_PDF = require('@/assets/docs/hop-dong-mau.pdf');

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

const sortContracts = (a: Contract, b: Contract) => typeOrder[a.type] - typeOrder[b.type] || b.signedDate.localeCompare(a.signedDate);

/** Hợp đồng / phiếu của KHÁCH ĐANG ĐĂNG NHẬP (database dùng chung, xem `services/supabase/customerData.ts`). */
export async function getContracts(filter: ContractFilter = {}): Promise<ContractListItem[]> {
  if (isNoxhOnlySession()) return [];
  if (AUTH_BACKEND === 'api') {
    return (await getContractBundles()).map((b) => b.item).filter((c) => matchesContractFilter(c, filter)).sort(sortContracts);
  }
  await simulateLatency();
  return mockContracts
    .filter((c) => matchesContractFilter(c, filter))
    .sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || b.signedDate.localeCompare(a.signedDate))
    .map(toListItem);
}

/** Số lượng hợp đồng theo tab (áp dụng cùng từ khóa tìm kiếm). */
export async function getContractCounts(search?: string): Promise<ContractCounts> {
  if (isNoxhOnlySession()) return countContractsByStatus([]);
  if (AUTH_BACKEND === 'api') {
    return countContractsByStatus((await getContractBundles()).map((b) => b.contract).filter((c) => matchesContractSearch(c, search)));
  }
  await simulateLatency();
  return countContractsByStatus(mockContracts.filter((c) => matchesContractSearch(c, search)));
}

export async function getContractById(id: string): Promise<ContractDetail> {
  if (isNoxhOnlySession()) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  if (AUTH_BACKEND === 'api') {
    // Chỉ tìm trong hợp đồng của khách hiện tại → id của khách khác luôn "không tìm thấy".
    const bundle = (await getContractBundles()).find((b) => b.contract.id === id);
    if (!bundle) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
    const company = await getSellerCompany();
    return {
      contract: bundle.item,
      installments: bundle.installments,
      seller: {
        companyName: company?.ten_ct ?? '',
        representative: '',
        position: '',
        taxCode: '',
        address: company?.dia_chi ?? '',
        hotline: company?.dien_thoai ?? '',
        email: company?.email ?? '',
      },
      terms: [],
    };
  }
  await simulateLatency();
  const contract = mockContracts.find((c) => c.id === id);
  if (!contract) throw new ServiceError('Không tìm thấy hợp đồng.', 'NOT_FOUND');
  return {
    contract: toListItem(contract),
    installments: buildInstallmentViews(contract),
    seller: clone(mockSeller),
    terms: clone(mockTermsByType[contract.type]),
    document: { title: `Hợp đồng ${contract.code}.pdf`, url: Asset.fromModule(SAMPLE_CONTRACT_PDF).uri },
  };
}
