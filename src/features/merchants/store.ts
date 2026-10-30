/**
 * Temporary in-memory data until the merchants API exists.
 * Data resets on page reload. Components only use `useMerchants()`,
 * so swapping in TanStack Query + API calls later stays contained.
 */
import { create } from 'zustand'
import type { Merchant, MerchantFormValues } from './schemas'

const SAMPLE_MERCHANTS: Merchant[] = [
  {
    id: 'mer_1',
    name: 'Himalayan Electronics',
    merchantCode: 'MER00001',
    panNumber: '601234567',
    phoneNumber: '9801234567',
    email: 'accounts@himalayanelectronics.example',
    status: 'active',
  },
  {
    id: 'mer_2',
    name: 'Kathmandu Furniture House',
    merchantCode: 'MER00002',
    panNumber: '602345678',
    phoneNumber: '9812345678',
    email: 'finance@ktmfurniture.example',
    status: 'active',
  },
  {
    id: 'mer_3',
    name: 'Pokhara Mobile Store',
    merchantCode: 'MER00003',
    panNumber: '603456789',
    phoneNumber: '9845678901',
    email: 'info@pokharamobile.example',
    status: 'inactive',
  },
]

interface MerchantsState {
  merchants: Merchant[]
  addMerchant: (values: MerchantFormValues) => void
  updateMerchant: (id: string, values: MerchantFormValues) => void
}

export const useMerchants = create<MerchantsState>()((set) => ({
  merchants: SAMPLE_MERCHANTS,
  addMerchant: (values) =>
    set((s) => ({ merchants: [...s.merchants, { id: crypto.randomUUID(), ...values }] })),
  updateMerchant: (id, values) =>
    set((s) => ({ merchants: s.merchants.map((m) => (m.id === id ? { ...m, ...values } : m)) })),
}))
