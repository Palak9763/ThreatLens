// Generates the JSON "database" used by the app (run: node scripts/generate-data.mjs)
// Timestamps are stored as `minutesAgo` so the dashboard always looks fresh.
import { writeFileSync, mkdirSync } from 'node:fs';

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const wpick = (items, weights) => {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
};
const ip = () => `${[45, 91, 103, 185, 194, 203, 77, 112][Math.floor(rnd() * 8)]}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 255)}.${Math.floor(rnd() * 254) + 1}`;
const hex = (n) => Array.from({ length: n }, () => Math.floor(rnd() * 16).toString(16)).join('');

const types = ['Malware', 'Phishing', 'Ransomware', 'DDoS', 'Brute Force', 'SQL Injection', 'Zero-Day', 'Insider Threat'];
const typeWeights = [22, 24, 10, 14, 14, 8, 4, 4];
const tactics = {
  Malware: 'Execution', Phishing: 'Initial Access', Ransomware: 'Impact', DDoS: 'Impact',
  'Brute Force': 'Credential Access', 'SQL Injection': 'Initial Access', 'Zero-Day': 'Exploitation', 'Insider Threat': 'Exfiltration'
};
const names = {
  Malware: ['Emotet Loader', 'AgentTesla Stealer', 'Qakbot Dropper', 'RedLine Infostealer', 'Remcos RAT'],
  Phishing: ['Credential Harvest Campaign', 'Fake Invoice Email', 'CEO Fraud Attempt', 'Spoofed Login Portal'],
  Ransomware: ['LockBit Variant Detected', 'BlackCat Encryptor', 'Akira Payload'],
  DDoS: ['UDP Flood', 'HTTP Request Flood', 'SYN Flood Attack', 'DNS Amplification'],
  'Brute Force': ['SSH Password Spray', 'RDP Login Attempts', 'Admin Panel Brute Force'],
  'SQL Injection': ['Blind SQLi Probe', 'Union-Based Injection', 'Login Form Injection'],
  'Zero-Day': ['Unpatched RCE Exploit', 'Suspicious Kernel Exploit'],
  'Insider Threat': ['Bulk Data Download', 'Unusual After-Hours Access']
};
const countries = [['China', 'CN'], ['Russia', 'RU'], ['United States', 'US'], ['Brazil', 'BR'], ['India', 'IN'], ['Iran', 'IR'], ['North Korea', 'KP'], ['Germany', 'DE'], ['Vietnam', 'VN'], ['Ukraine', 'UA']];
const countryW = [26, 22, 12, 8, 7, 9, 6, 4, 4, 2];
const assets = ['Web Server', 'Mail Gateway', 'Database Server', 'VPN Gateway', 'HR Laptop', 'Finance Workstation', 'Domain Controller', 'Cloud Storage'];
const sevFor = { Ransomware: [40, 40, 15, 5], 'Zero-Day': [50, 40, 10, 0], Malware: [15, 40, 35, 10], Phishing: [8, 30, 42, 20], DDoS: [10, 35, 40, 15], 'Brute Force': [4, 20, 46, 30], 'SQL Injection': [12, 40, 36, 12], 'Insider Threat': [20, 40, 30, 10] };
const sevs = ['Critical', 'High', 'Medium', 'Low'];

const threats = Array.from({ length: 140 }, (_, i) => {
  const type = wpick(types, typeWeights);
  const [country, cc] = wpick(countries, countryW);
  const minutesAgo = Math.floor(Math.pow(rnd(), 1.4) * 60 * 24 * 14) + 2;
  const severity = wpick(sevs, sevFor[type]);
  const status = minutesAgo < 600 ? wpick(['Active', 'Investigating', 'Mitigated'], [55, 30, 15]) : wpick(['Active', 'Investigating', 'Mitigated'], [10, 15, 75]);
  return {
    id: `THR-${String(1001 + i)}`,
    name: pick(names[type]),
    type, severity, status, country, countryCode: cc,
    sourceIp: ip(), targetAsset: pick(assets),
    tactic: tactics[type],
    confidence: 55 + Math.floor(rnd() * 45),
    minutesAgo,
    description: `${type} activity originating from ${country} targeting the ${'organisation'}'s infrastructure. Detected by the perimeter sensors and correlated with threat intelligence feeds.`
  };
});

const iocTypes = ['ip', 'domain', 'hash', 'url'];
const domains = ['secure-login-verify.com', 'update-microsoft-cdn.net', 'invoice-docs-portal.org', 'cdn-static-files.xyz', 'bank-alert-support.info', 'dl-freeware-tools.top', 'mail-auth-check.cc'];
const tags = ['botnet', 'c2-server', 'phishing', 'malware-host', 'scanner', 'tor-exit', 'ransomware', 'spam'];
const iocs = [];
for (let i = 0; i < 60; i++) {
  const t = iocTypes[i % 4];
  const riskScore = Math.floor(rnd() * 100);
  let value;
  if (t === 'ip') value = ip();
  else if (t === 'domain') value = i < 28 ? domains[(i / 4) | 0] ?? `${hex(6)}-secure.com` : `${hex(7)}-portal.net`;
  else if (t === 'hash') value = hex(64);
  else value = `http://${hex(6)}-files.top/${hex(5)}/payload.exe`;
  const [country] = wpick(countries, countryW);
  iocs.push({
    id: `IOC-${String(2001 + i)}`, value, type: t, riskScore,
    verdict: riskScore >= 75 ? 'Malicious' : riskScore >= 40 ? 'Suspicious' : 'Clean',
    tags: [pick(tags), pick(tags)].filter((v, idx, a) => a.indexOf(v) === idx),
    country, reports: Math.floor(rnd() * 400),
    firstSeenMinutesAgo: Math.floor(rnd() * 60 * 24 * 120) + 60,
    lastSeenMinutesAgo: Math.floor(rnd() * 60 * 24 * 3) + 1
  });
}
// guaranteed demo values so lookups always work in the viva
iocs[0] = { ...iocs[0], value: '185.220.101.45', type: 'ip', riskScore: 92, verdict: 'Malicious', tags: ['tor-exit', 'botnet'], reports: 388 };
iocs[1] = { ...iocs[1], value: 'secure-login-verify.com', type: 'domain', riskScore: 88, verdict: 'Malicious', tags: ['phishing'], reports: 214 };
iocs[2] = { ...iocs[2], value: '8.8.8.8', type: 'ip', riskScore: 3, verdict: 'Clean', tags: [], reports: 0, country: 'United States' };

const titles = [
  ['Ransomware outbreak on finance subnet', 'Critical', 'Investigating'],
  ['Suspicious VPN logins from multiple countries', 'High', 'Open'],
  ['Phishing campaign targeting HR team', 'High', 'Investigating'],
  ['DDoS on customer portal', 'High', 'Resolved'],
  ['Unpatched Apache server exposed', 'Medium', 'Open'],
  ['Brute-force attempts on admin panel', 'Medium', 'Investigating'],
  ['Malware detected on reception PC', 'Medium', 'Resolved'],
  ['Data exfiltration alert - cloud bucket', 'Critical', 'Open'],
  ['Expired SSL certificate on mail gateway', 'Low', 'Closed'],
  ['SQL injection probes against login API', 'High', 'Resolved'],
  ['Unauthorized USB device in server room', 'Low', 'Closed'],
  ['Insider downloading bulk customer records', 'Critical', 'Investigating'],
  ['Weak password policy audit finding', 'Low', 'Open'],
  ['C2 beaconing from marketing laptop', 'High', 'Open']
];
const analysts = ['Aarav Sharma', 'Priya Nair', 'Rohan Patil', 'Sneha Kulkarni'];
const incidents = titles.map(([title, severity, status], i) => ({
  id: `INC-${String(301 + i)}`, title, severity, status,
  assignee: analysts[i % 4],
  createdMinutesAgo: Math.floor(rnd() * 60 * 24 * 9) + 30,
  description: `Incident raised after correlated alerts. Initial triage in progress for: ${title.toLowerCase()}.`,
  notes: [{ author: analysts[i % 4], text: 'Incident created and triage started.', minutesAgo: 20 }]
}));

const users = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'admin123', role: 'admin', email: 'admin@secops.local', department: 'Security Management' },
  { id: 2, name: 'Aarav Sharma', username: 'analyst', password: 'analyst123', role: 'analyst', email: 'aarav@secops.local', department: 'SOC Tier 2' },
  { id: 3, name: 'Priya Nair', username: 'viewer', password: 'viewer123', role: 'viewer', email: 'priya@secops.local', department: 'Compliance' },
  { id: 4, name: 'Rohan Patil', username: 'rohan', password: 'rohan123', role: 'analyst', email: 'rohan@secops.local', department: 'SOC Tier 1' }
];

mkdirSync('public/data', { recursive: true });
for (const [n, d] of Object.entries({ threats, iocs, incidents, users })) writeFileSync(`public/data/${n}.json`, JSON.stringify(d, null, 1));
console.log('Generated:', threats.length, 'threats,', iocs.length, 'iocs,', incidents.length, 'incidents,', users.length, 'users');
