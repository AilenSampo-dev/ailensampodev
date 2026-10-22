import type { Client, ClientStatus } from "@/types/erp";

export type CreateClientFromProposalInput = {
  name: string;
  email: string;
  company: string;
  proposalSlug: string;
  proposalTitle: string;
  acceptedAt: string;
};

export type ClientRepository = {
  listAll(): Promise<Client[]>;
  getByEmail(email: string): Promise<Client | null>;
  upsertFromProposal(input: CreateClientFromProposalInput): Promise<Client>;
};

const clients = new Map<string, Client>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockClientRepository: ClientRepository = {
  async listAll() {
    return [...clients.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getByEmail(email) {
    return clients.get(normalizeEmail(email)) ?? null;
  },

  async upsertFromProposal(input) {
    const email = normalizeEmail(input.email);
    const existing = clients.get(email);

    if (existing) {
      const updated: Client = {
        ...existing,
        name: input.name.trim() || existing.name,
        company: input.company.trim() || existing.company,
        status: "lead" satisfies ClientStatus,
        proposalSlug: input.proposalSlug,
        proposalTitle: input.proposalTitle,
        acceptedAt: input.acceptedAt,
      };
      clients.set(email, updated);
      return updated;
    }

    const client: Client = {
      id: nextId("client"),
      name: input.name.trim(),
      email,
      company: input.company.trim(),
      status: "lead",
      createdAt: input.acceptedAt,
      proposalSlug: input.proposalSlug,
      proposalTitle: input.proposalTitle,
      acceptedAt: input.acceptedAt,
    };

    clients.set(email, client);
    return client;
  },
};

export function getClientRepository(): ClientRepository {
  return mockClientRepository;
}
