/**
 * Temporary in-memory data until the issuing banks API exists.
 * Data resets on page reload. Replace with TanStack Query + API calls later;
 * components only use `useIssuingBanks()`, so they won't need to change much.
 */
import { create } from 'zustand'
import type { IssuingBank, IssuingBankFormValues } from './schemas'

const SAMPLE_BANKS: IssuingBank[] = [
  { id: 'bank_1', name: 'Nabil Bank Limited', swiftCode: 'NARBNPKA', status: 'active' },
  { id: 'bank_2', name: 'Global IME Bank Limited', swiftCode: 'GLBBNPKA', status: 'active' },
  { id: 'bank_3', name: 'Kumari Bank Limited', swiftCode: 'KMBLNPKA', status: 'active' },
  { id: 'bank_4', name: 'Laxmi Sunrise Bank Limited', swiftCode: 'LXBLNPKA', status: 'active' },
  { id: 'bank_5', name: 'NIC Asia Bank Limited', swiftCode: 'NICENPKA', status: 'active' },
  { id: 'bank_6', name: 'Himalayan Bank Limited', swiftCode: 'HIMANPKA', status: 'inactive' },
  { id: 'bank_7', name: 'Everest Bank Limited', swiftCode: 'EVBLNPKA', status: 'active' },
  { id: 'bank_8', name: 'Siddhartha Bank Limited', swiftCode: 'SIDDNPKA', status: 'inactive' },
]

interface IssuingBanksState {
  banks: IssuingBank[]
  addBank: (values: IssuingBankFormValues) => void
  updateBank: (id: string, values: IssuingBankFormValues) => void
}

export const useIssuingBanks = create<IssuingBanksState>()((set) => ({
  banks: SAMPLE_BANKS,
  addBank: (values) =>
    set((s) => ({ banks: [...s.banks, { id: crypto.randomUUID(), ...values }] })),
  updateBank: (id, values) =>
    set((s) => ({ banks: s.banks.map((b) => (b.id === id ? { ...b, ...values } : b)) })),
}))
