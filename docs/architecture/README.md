# Architecture

| Item | What |
|---|---|
| [`SYSTEM_DESIGN.md`](SYSTEM_DESIGN.md) | The high-level design: goals and quality targets, C4 levels 1–4, deployment, UML structural and behavioural views, DFDs, the data model and cross-cutting concerns |
| [`diagrams/`](diagrams/README.md) | 35 PlantUML diagrams in standard notation, with SVG and PNG exports:<br>• **UML structural:** class, object, component, deployment, package, composite structure, profile;<br>• **UML behavioural:** use case, 5 sequences, 4 state machines, 3 activities;<br>• **C4** levels 1–4;<br>• **DFD** levels 0–2;<br>• **5 ERDs**;<br>• **the CI/CD pipeline** |
| [`database/schema.sql`](../../database/schema.sql) | Reviewed PostgreSQL 16 DDL that matches the ERDs |
| [`adr/`](adr/README.md) | 14 architecture decision records |
| [`rfc/`](rfc/README.md) | 4 RFCs, plus the RFC process and template |

**FigJam:** the [old FigJam board](https://www.figma.com/board/G0iIP3edAdYZb6N6ePf6r6) holds copies of the previous Mermaid versions. It is out of date, and partly cleared because the Figma plan's limit was reached; delete it or ignore it. The `.puml` files are the source of truth. For hand-tuned figures, import a `.puml` file into draw.io (Arrange → Insert → Advanced → PlantUML).

**Related:**
- `docs/api/` (OpenAPI);
- `docs/devops/` (CI/CD);
- `docs/security/` (threat model, compliance, data governance);
- `docs/testing/` (strategy and cases).

The `System Design/` folder at the repository root holds the earlier draw.io drawings for the superseded Big Five design. It is kept unchanged, for history only.
