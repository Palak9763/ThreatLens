# Architecture & Design Diagrams (Mermaid)

Render these in VS Code (Mermaid preview), GitHub, or https://mermaid.live and export as PNG for the report.

## 1. System Architecture
```mermaid
flowchart LR
  U[User - Admin / Analyst / Viewer] --> B[Browser]
  subgraph Angular SPA
    R[Router + Guards] --> F[Feature Components]
    F --> S[Services - RxJS BehaviorSubjects]
    F --> SH[Shared: Chart, Badge, Toast, Pipes]
  end
  B --> R
  S -->|HttpClient GET| J[(JSON files: threats, iocs, incidents, users)]
  S -->|persist| L[(localStorage / sessionStorage)]
  SH --> C[Chart.js]
```

## 2. Use-Case Diagram
```mermaid
flowchart LR
  V([Viewer]) --> UC1(Login)
  V --> UC2(View dashboard)
  V --> UC3(Browse and search threats)
  V --> UC4(IOC lookup)
  V --> UC5(View incidents)
  V --> UC6(Export reports)
  A([Analyst]) --> UC1
  A --> UC2
  A --> UC3
  A --> UC4
  A --> UC6
  A --> UC7(Block IP / update threat status)
  A --> UC8(Create, edit, move incidents)
  A --> UC9(Add incident notes)
  AD([Admin]) --> UC1
  AD --> UC7
  AD --> UC8
  AD --> UC6
  AD --> UC10(Manage user roles)
```

## 3. Workflow
```mermaid
flowchart TD
  A[Login] --> B{Valid credentials?}
  B -- No --> A
  B -- Yes --> C[Dashboard overview]
  C --> D[Open Threat Feed]
  D --> E[Search / filter threat]
  E --> F[Open threat details]
  F --> G{Confirmed malicious?}
  G -- Yes --> H[Block IP + Create incident]
  G -- No --> I[Mark mitigated]
  H --> J[Incident board: Open -> Investigating -> Resolved -> Closed]
  J --> K[Generate report / export CSV]
```

## 4. Component Hierarchy
```mermaid
flowchart TD
  App --> Toast[ToastContainer]
  App --> RO[RouterOutlet]
  RO --> Login
  RO --> Shell
  Shell --> Dashboard
  Shell --> ThreatFeed
  Shell --> ThreatDetail
  Shell --> IocLookup
  Shell --> Incidents
  Shell --> Reports
  Shell --> Users
  Dashboard --> Chart
  Dashboard --> Badge
  ThreatFeed --> Badge
  ThreatDetail --> Badge
  IocLookup --> Badge
  Incidents --> Badge
  Reports --> Chart
```

## 5. Data Flow (RxJS)
```mermaid
sequenceDiagram
  participant C as Component
  participant D as DataService
  participant J as JSON files
  C->>D: load()
  D->>J: forkJoin(HTTP GET x4)
  J-->>D: threats, iocs, incidents, users
  D-->>C: BehaviorSubject streams (toSignal)
  C->>D: moveIncident()
  D->>D: update BehaviorSubject + localStorage
  D-->>C: new stream value, UI re-renders
```
