import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WebDomain, WebEmailAccount, WebProject } from '../types';

interface WebDevState {
  domains: WebDomain[];
  emailAccounts: WebEmailAccount[];
  projects: WebProject[];

  addDomain: (domain: Omit<WebDomain, 'id' | 'createdAt' | 'updatedAt'>) => WebDomain;
  updateDomain: (id: string, updates: Partial<Omit<WebDomain, 'id' | 'createdAt'>>) => void;
  deleteDomain: (id: string) => void;

  addEmailAccount: (account: Omit<WebEmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => WebEmailAccount;
  updateEmailAccount: (id: string, updates: Partial<Omit<WebEmailAccount, 'id' | 'createdAt'>>) => void;
  deleteEmailAccount: (id: string) => void;

  addProject: (project: Omit<WebProject, 'id' | 'createdAt' | 'updatedAt'>) => WebProject;
  updateProject: (id: string, updates: Partial<Omit<WebProject, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
}

export const useWebDevStore = create<WebDevState>()(
  persist(
    (set) => ({
      domains: [],
      emailAccounts: [],
      projects: [],

      addDomain: (domain) => {
        const now = new Date().toISOString();
        const newDomain: WebDomain = { ...domain, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({ domains: [...s.domains, newDomain] }));
        return newDomain;
      },
      updateDomain: (id, updates) =>
        set((s) => ({
          domains: s.domains.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d,
          ),
        })),
      deleteDomain: (id) => set((s) => ({ domains: s.domains.filter((d) => d.id !== id) })),

      addEmailAccount: (account) => {
        const now = new Date().toISOString();
        const newAccount: WebEmailAccount = { ...account, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({ emailAccounts: [...s.emailAccounts, newAccount] }));
        return newAccount;
      },
      updateEmailAccount: (id, updates) =>
        set((s) => ({
          emailAccounts: s.emailAccounts.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e,
          ),
        })),
      deleteEmailAccount: (id) =>
        set((s) => ({ emailAccounts: s.emailAccounts.filter((e) => e.id !== id) })),

      addProject: (project) => {
        const now = new Date().toISOString();
        const newProject: WebProject = { ...project, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        set((s) => ({ projects: [...s.projects, newProject] }));
        return newProject;
      },
      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
          ),
        })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    }),
    { name: 'svp-webdev' },
  ),
);
