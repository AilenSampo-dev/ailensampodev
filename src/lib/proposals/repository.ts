import type {
  CreateProposalInput,
  Proposal,
  ProposalOpen,
  ProposalOpenStats,
  ProposalStatus,
} from "@/types/erp";
import { loadContentProposals } from "./content";
import { createProposalSlug } from "./slug";

export type ProposalListItem = Proposal & {
  totalOpens: number;
  uniqueIps: number;
};

/** Contrato del repositorio — implementación Firestore en Fase 3. */
export type ProposalRepository = {
  listAll(): Promise<ProposalListItem[]>;
  getBySlug(slug: string): Promise<Proposal | null>;
  create(input: CreateProposalInput): Promise<Proposal>;
  recordOpen(
    slug: string,
    open: Omit<ProposalOpen, "id" | "proposalId">
  ): Promise<ProposalOpen | null>;
  accept(slug: string, ipHash: string): Promise<Proposal | null>;
  getOpenStats(slug: string): Promise<ProposalOpenStats[]>;
};

const DEMO_PROPOSAL: Proposal = {
  id: "demo",
  slug: "demo",
  clientId: "client-demo",
  clientName: "Cliente demo",
  projectId: "project-demo",
  title: "Sistema web a medida",
  summary:
    "Propuesta para diseñar y desarrollar un sistema digital que automatice la operación diaria de tu negocio.",
  sections: [
    {
      title: "Alcance",
      body: "Sitio web, panel interno, integración con email y seguimiento de clientes.",
    },
    {
      title: "Entregables",
      body: "Diseño, desarrollo, deploy en Vercel, documentación básica y capacitación.",
    },
    {
      title: "Condiciones",
      body: "50% al inicio, 50% contra entrega. Cambios fuera de alcance se cotizan aparte.",
    },
  ],
  price: "USD 2.400",
  timeline: "6 semanas",
  status: "sent",
  createdAt: "2026-07-01T12:00:00.000Z",
  sentAt: "2026-07-15T10:00:00.000Z",
  format: "simple",
};

const proposals = new Map<string, Proposal>([["demo", DEMO_PROPOSAL]]);
const opens = new Map<string, ProposalOpen[]>();

for (const proposal of loadContentProposals()) {
  proposals.set(proposal.slug, proposal);
  opens.set(proposal.slug, []);
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function touchProposalStatus(
  proposal: Proposal,
  next: ProposalStatus
): Proposal {
  const updated = { ...proposal, status: next };
  proposals.set(proposal.slug, updated);
  return updated;
}

function aggregateOpenStats(slug: string): ProposalOpenStats[] {
  const list = opens.get(slug) ?? [];
  const byIp = new Map<string, ProposalOpenStats>();

  for (const open of list) {
    const existing = byIp.get(open.ipHash);
    if (!existing) {
      byIp.set(open.ipHash, {
        ipHash: open.ipHash,
        count: 1,
        firstOpenedAt: open.openedAt,
        lastOpenedAt: open.openedAt,
        geoCountry: open.geoCountry,
        geoRegion: open.geoRegion,
        geoCity: open.geoCity,
      });
      continue;
    }

    byIp.set(open.ipHash, {
      ...existing,
      count: existing.count + 1,
      lastOpenedAt: open.openedAt,
      geoCountry: open.geoCountry ?? existing.geoCountry,
      geoRegion: open.geoRegion ?? existing.geoRegion,
      geoCity: open.geoCity ?? existing.geoCity,
    });
  }

  return [...byIp.values()].sort(
    (a, b) =>
      new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
  );
}

/** Mock en memoria para desarrollo local hasta conectar Firestore. */
export const mockProposalRepository: ProposalRepository = {
  async listAll() {
    const items = [...proposals.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return items.map((proposal) => {
      const stats = aggregateOpenStats(proposal.slug);
      const totalOpens = stats.reduce((sum, row) => sum + row.count, 0);
      return {
        ...proposal,
        totalOpens,
        uniqueIps: stats.length,
      };
    });
  },

  async getBySlug(slug) {
    return proposals.get(slug) ?? null;
  },

  async create(input) {
    let slug = createProposalSlug();
    while (proposals.has(slug)) {
      slug = createProposalSlug();
    }

    const now = new Date().toISOString();
    const proposal: Proposal = {
      id: nextId("prop"),
      slug,
      clientId: nextId("client"),
      clientName: input.clientName.trim(),
      projectId: nextId("project"),
      title: input.title.trim(),
      summary: input.summary.trim(),
      sections: input.sections.map((section) => ({
        title: section.title.trim(),
        body: section.body.trim(),
      })),
      price: input.price.trim(),
      timeline: input.timeline.trim(),
      format: "simple",
      status: "sent",
      createdAt: now,
      sentAt: now,
    };

    proposals.set(slug, proposal);
    opens.set(slug, []);
    return proposal;
  },

  async recordOpen(slug, data) {
    const proposal = proposals.get(slug);
    if (!proposal) return null;

    const entry: ProposalOpen = {
      id: nextId("open"),
      proposalId: proposal.id,
      ...data,
    };

    const list = opens.get(slug) ?? [];
    list.push(entry);
    opens.set(slug, list);

    if (proposal.status === "sent") {
      touchProposalStatus(proposal, "viewed");
    }

    return entry;
  },

  async accept(slug, ipHash) {
    const proposal = proposals.get(slug);
    if (!proposal || proposal.status === "accepted") return proposal ?? null;

    const updated: Proposal = {
      ...proposal,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedIpHash: ipHash,
    };
    proposals.set(slug, updated);
    return updated;
  },

  async getOpenStats(slug) {
    return aggregateOpenStats(slug);
  },
};

export function getProposalRepository(): ProposalRepository {
  // Fase 3: return firestoreProposalRepository when Firebase is configured.
  return mockProposalRepository;
}
