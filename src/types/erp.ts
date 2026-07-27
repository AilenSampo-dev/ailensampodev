export type ClientStatus = "lead" | "active" | "inactive";

export type ProjectStatus =
  | "draft"
  | "proposal"
  | "active"
  | "paused"
  | "completed";

export type ProposalStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected";

export type Client = {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: ClientStatus;
  createdAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  title: string;
  url?: string;
  status: ProjectStatus;
  createdAt: string;
};

export type ProposalSection = {
  title: string;
  body: string;
};

export type ProposalFormat = "simple" | "document";

export type Proposal = {
  id: string;
  slug: string;
  clientId: string;
  clientName?: string;
  projectId: string;
  title: string;
  summary: string;
  sections: ProposalSection[];
  price: string;
  timeline: string;
  format?: ProposalFormat;
  status: ProposalStatus;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  acceptedIpHash?: string;
};

export type CreateProposalInput = {
  clientName: string;
  title: string;
  summary: string;
  price: string;
  timeline: string;
  sections: ProposalSection[];
};

export type ProposalOpen = {
  id: string;
  proposalId: string;
  ipHash: string;
  openedAt: string;
  referrer?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  geoCountry?: string;
  geoRegion?: string;
  geoCity?: string;
};

export type ProposalOpenStats = {
  ipHash: string;
  count: number;
  firstOpenedAt: string;
  lastOpenedAt: string;
  geoCountry?: string;
  geoRegion?: string;
  geoCity?: string;
};
