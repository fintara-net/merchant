/**
 * Temporary in-memory users until the users API exists. Starts empty and
 * resets on reload. Swap for TanStack Query + API calls later; components only
 * use `useUsers()`.
 */
import { create } from 'zustand'
import type { ManagedUser, UserFormValues, UserStatus } from './schemas'

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
  users: [],
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
