# Diagrams

Every diagram is a **PlantUML source file (`.puml`)** drawn in standard UML, C4, DFD and ERD notation. Each one has an `.svg` (for documents and the report) and a `.png` (for slides) next to it. [`../SYSTEM_DESIGN.md`](../SYSTEM_DESIGN.md) explains them.

The style follows the university's reference diagrams (GeeksforGeeks and Visual Paradigm). The shared theme is in `_style/rahyaab-uml.iuml`:
- **Class, object, package and component boxes:** green headers.
- **Use cases:** stick-figure actors, orange ellipses, a system boundary, and dashed «include»/«extend» arrows.
- **Sequence diagrams:** blue lifelines with activation bars, numbered messages, and `loop` / `alt` / `opt` frames with guards.
- **Activity and state diagrams:** a black start node, a bull's-eye end node, rounded actions, decision diamonds, fork and join bars, and swimlanes.

## The set (35 diagrams)

| Group | Diagrams |
|---|---|
| **UML structural** (`uml/`) | `class-domain` · `object-snapshot` · `component` · `deployment` · `package` · `composite-structure` · `profile` |
| **UML behavioural** (`uml/`) | `use-case` · `seq-01-join-consent` · `seq-02-play-sync` · `seq-03-compute-results` · `seq-04-share-parent` · `seq-05-staff-login` (with password reset) · `state-consent` · `state-week-run` · `state-outbox-event` · `state-share-link` · `activity-onboarding` · `activity-play-week` (swimlanes) · `activity-recommendation` |
| **C4 model** (`c4/`) | `c4-1-context` · `c4-2-containers` · `c4-3-components-api` · `c4-3-components-app` · `c4-4-code-scoring` (class level). These use the official C4-PlantUML library |
| **Data flow** (`dfd/`) | `dfd-0-context` · `dfd-1` · `dfd-2-scoring`. Yourdon–DeMarco notation: squares are external entities, ellipses are processes, and stores are labelled D1–D8 |
| **Entity-relationship** (`erd/`) | `erd-0-overview` · `erd-1-identity-consent` · `erd-2-gameplay-telemetry` · `erd-3-results-library` · `erd-4-staff-operations`. Crow's-foot notation, with `*` marking a mandatory column. Matches `../data/schema.sql` |
| **DevOps** (`devops/`) | `pipeline` (CI/CD as an activity diagram) |
| **Project plan** (`docs/project/diagrams/`) | `gantt` |

## Editing in VS Code

1. **Install the extension:** "PlantUML" (`jebbs.plantuml`).
2. **Install the dependencies:**
   - **Java 17+** (for example Eclipse Temurin);
   - **Graphviz**.
3. **Preview:** open a `.puml` file and press **Alt + D**.
4. **Export:** run the command "PlantUML: Export Current Diagram", or use the command line:

```bash
java -jar plantuml.jar -tsvg -charset UTF-8 "docs/architecture/diagrams/**/*.puml" "docs/project/diagrams/*.puml"
```

```bash
java -jar plantuml.jar -tpng -SDpi=170 -charset UTF-8 "docs/architecture/diagrams/**/*.puml" "docs/project/diagrams/*.puml"
```

**Rules:**
- Keep each diagram consistent with the SRS IDs and `schema.sql`.
- Change a diagram in the same PR as the code or document it describes.

## FigJam and draw.io

- **draw.io:** "Arrange → Insert → Advanced → PlantUML" imports any `.puml` file for hand-tuning (for example, for report figures).
- **FigJam:** the FigJam board linked in `../README.md` holds earlier copies made from the previous Mermaid versions. It is **out of date**; use these files instead.
