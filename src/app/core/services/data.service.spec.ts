import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataService } from './data.service';

const threats = [
  { id: 'THR-1', name: 'Test', type: 'Malware', severity: 'High', status: 'Active', country: 'India', countryCode: 'IN', sourceIp: '1.1.1.1', targetAsset: 'Web', tactic: 'Execution', confidence: 80, minutesAgo: 10, description: '' }
];
const iocs = [
  { id: 'IOC-1', value: '8.8.8.8', type: 'ip', riskScore: 3, verdict: 'Clean', tags: [], country: 'US', reports: 0, firstSeenMinutesAgo: 100, lastSeenMinutesAgo: 5 }
];
const incidents = [
  { id: 'INC-301', title: 'Test incident', severity: 'High', status: 'Open', assignee: 'A', createdMinutesAgo: 30, description: 'desc', notes: [] }
];

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DataService);
    const http = TestBed.inject(HttpTestingController);
    service.load();
    http.expectOne('data/threats.json').flush(threats);
    http.expectOne('data/iocs.json').flush(iocs);
    http.expectOne('data/incidents.json').flush(incidents);
    http.expectOne('data/users.json').flush([]);
  });

  it('loads threats and converts minutesAgo to a Date', async () => {
    const list = await firstValueFrom(service.threats);
    expect(list.length).toBe(1);
    expect(list[0].timestamp instanceof Date).toBe(true);
  });

  it('finds a known IOC (case-insensitive) and returns undefined for unknown', () => {
    expect(service.lookupIoc(' 8.8.8.8 ')?.verdict).toBe('Clean');
    expect(service.lookupIoc('1.2.3.4')).toBeUndefined();
  });

  it('blocks an IP and marks the threat mitigated', async () => {
    service.blockIp('THR-1');
    const t = (await firstValueFrom(service.threats))[0];
    expect(t.blocked).toBe(true);
    expect(t.status).toBe('Mitigated');
  });

  it('creates an incident with the next sequential id', () => {
    const inc = service.createIncident({ title: 'New', severity: 'Low', assignee: 'B', description: 'details here' }, 'Tester');
    expect(inc.id).toBe('INC-302');
    expect(inc.status).toBe('Open');
  });

  it('moves an incident and records a note', () => {
    service.moveIncident('INC-301', 'Resolved', 'Tester');
    const inc = service.getIncident('INC-301')!;
    expect(inc.status).toBe('Resolved');
    expect(inc.notes.at(-1)?.text).toContain('Open → Resolved');
  });

  it('deletes an incident', () => {
    service.deleteIncident('INC-301');
    expect(service.getIncident('INC-301')).toBeUndefined();
  });
});
