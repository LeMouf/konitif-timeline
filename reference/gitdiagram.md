# GitDiagram architecture — @konitif/timeline

This architecture view was generated from the public repository by [GitDiagram](https://gitdiagram.com/lemouf/konitif-timeline) on 2026-09-20 18:45:41 UTC.

It is a documentation projection of the repository tree, README, and source files sampled by GitDiagram. It does not replace the authored contracts in [catalog.json](catalog.json) and [diagrams.json](diagrams.json), nor does it establish runtime authority.

The Mermaid source keeps GitDiagram's groups, nodes, relationships, and source links. GitDiagram's forced color classes and HTML line breaks are omitted so the diagram remains readable in local previews and dark themes.

- Public repository: [konitif-timeline](https://github.com/LeMouf/konitif-timeline)
- Interactive diagram: [Open in GitDiagram](https://gitdiagram.com/lemouf/konitif-timeline)

## Architecture diagram

```mermaid
flowchart TD

subgraph group_projection["Projection API"]
  node_contracts["Timeline contracts — [contracts.ts]"]
  node_projection_node["Subject projection — [projection.ts]"]
end

subgraph group_interaction["Interaction State"]
  node_state["State reducer — [state.ts]"]
end

subgraph group_viewport["Viewport Math"]
  node_view_window["View window — [viewWindow.ts]"]
  node_scale["Scale and grid — [scale.ts]"]
end

subgraph group_sampling["Track Sampling"]
  node_sampling["Numeric sampling — [sampling.ts]"]
end

subgraph group_integration["Tool Integration"]
  node_tool_module["Tool module — [toolModule.ts]"]
end

node_host(("Host application"))
node_subject(("Temporal subject"))
node_contributions(("Track providers"))
node_interpolation["Interpolation callback"]
node_tools["KONITIF tools"]

node_host -->|"configures projection"| node_projection_node
node_subject -->|"provides subject"| node_projection_node
node_contributions -->|"supplies contributions"| node_projection_node
node_projection_node -->|"returns projection"| node_host
node_projection_node -->|"provides projection"| node_state
node_host -->|"reduces intents"| node_state
node_state -->|"returns state"| node_host
node_host -->|"normalizes viewport"| node_view_window
node_view_window -->|"uses zoom math"| node_scale
node_view_window -->|"returns viewport"| node_host
node_host -->|"creates ticks"| node_scale
node_host -->|"creates grid"| node_scale
node_host -->|"maps coordinates"| node_scale
node_scale -->|"returns metrics"| node_host
node_host -->|"samples tracks"| node_sampling
node_host -->|"injects function"| node_interpolation
node_sampling -->|"calls callback"| node_interpolation
node_sampling -->|"returns value"| node_host
node_tool_module -->|"declares capability"| node_tools

click node_contracts "https://github.com/lemouf/konitif-timeline/blob/main/src/contracts.ts"
click node_projection_node "https://github.com/lemouf/konitif-timeline/blob/main/src/projection.ts"
click node_state "https://github.com/lemouf/konitif-timeline/blob/main/src/state.ts"
click node_view_window "https://github.com/lemouf/konitif-timeline/blob/main/src/viewWindow.ts"
click node_scale "https://github.com/lemouf/konitif-timeline/blob/main/src/scale.ts"
click node_sampling "https://github.com/lemouf/konitif-timeline/blob/main/src/sampling.ts"
click node_tool_module "https://github.com/lemouf/konitif-timeline/blob/main/src/toolModule.ts"

```

## Generated analysis

@konitif/timeline is a headless temporal projection library. A host supplies a caller-owned subject and versioned track contributions; the projection normalizes tracks and duration, after which the host creates interaction state, viewport calculations, scale/grid data, and numeric samples. State intents are reduced deterministically, while viewport and scale functions calculate scrubbing, zoom, ticks, and coordinates. The tool declaration exposes the capability to KONITIF tooling. This map reflects the sampled runtime source and README; unsampled consumers are not inferred.
