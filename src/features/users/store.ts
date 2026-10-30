/**
 * Temporary in-memory users until the users API exists. Starts with the
 * logins of the sample merchants and resets on reload. Swap for TanStack Query + API calls later; components only
 * use `useUsers()`.
 */
import { create } from 'zustand'
import type { ManagedUser, UserFormValues, UserStatus } from './schemas'

const merchantLogin = (
  id: string,
  merchantId: string,
  username: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
): ManagedUser => ({
  id,
  username,
  firstName,
  middleName: null,
  lastName,
  phoneNumber,
  email,
  userType: 'merchant',
  bankId: null,
  merchantId,
  status: 'active',
  locked: false,
})

// Matches the sample merchants in features/merchants/store.ts
const SAMPLE_USERS: ManagedUser[] = [
  merchantLogin(
    'usr_1',
    'mer_1',
    'himalayan.electronics',
    'Ramesh',
    'Shrestha',
    '9801234567',
    'accounts@himalayanelectronics.example',
  ),
  merchantLogin(
    'usr_2',
    'mer_2',
    'ktm.furniture',
    'Anita',
    'Gurung',
    '9812345678',
    'finance@ktmfurniture.example',
  ),
  merchantLogin(
    'usr_3',
    'mer_3',
    'pokhara.mobile',
    'Bikash',
    'Thapa',
    '9845678901',
    'info@pokharamobile.example',
  ),
]

interface UsersState {
  users: ManagedUser[]
  addUser: (values: UserFormValues) => void
  updateUser: (id: string, values: UserFormValues) => void
  setLocked: (id: string, locked: boolean) => void
  setStatus: (id: string, status: UserStatus) => void
}

const toUser = (values: UserFormValues) => ({
  ...values,
  middleName: values.middleName || null,
  bankId: values.bankId || null,
  merchantId: values.merchantId || null,
})

export const useUsers = create<UsersState>()((set) => ({
  users: SAMPLE_USERS,
  addUser: (values) =>
    set((s) => ({
      users: [...s.users, { id: crypto.randomUUID(), locked: false, ...toUser(values) }],
    })),
  updateUser: (id, values) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...toUser(values) } : u)) })),
  setLocked: (id, locked) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, locked } : u)) })),
  setStatus: (id, status) =>
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status } : u)) })),
}))
