export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ThreatStatus = 'Active' | 'Investigating' | 'Mitigated';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed';
export type Role = 'admin' | 'analyst' | 'viewer';
export type IocType = 'ip' | 'domain' | 'hash' | 'url';
export type Verdict = 'Malicious' | 'Suspicious' | 'Clean';

export const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low'];
export const INCIDENT_STATUSES: IncidentStatus[] = ['Open', 'Investigating', 'Resolved', 'Closed'];

export interface Threat {
  id: string;
  name: string;
  type: string;
  severity: Severity;
  status: ThreatStatus;
  country: string;
  countryCode: string;
  sourceIp: string;
  targetAsset: string;
  tactic: string;
  confidence: number;
  timestamp: Date;
  description: string;
  blocked?: boolean;
}

export interface Ioc {
  id: string;
  value: string;
  type: IocType;
  riskScore: number;
  verdict: Verdict;
  tags: string[];
  country: string;
  reports: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface IncidentNote {
  author: string;
  text: string;
  timestamp: Date;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  assignee: string;
  createdAt: Date;
  description: string;
  notes: IncidentNote[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: Role;
  email: string;
  department: string;
}

export interface AppToast {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info' | 'danger';
}
