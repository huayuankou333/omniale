# Build a transistor-level SPICE workbench

Build a local, open-source web application for circuit modeling and simulation. It must import or create a circuit, edit its connections and values, run studies, display waveforms, and reopen projects. The app must run in Chromium without an internet connection.

## C1. Model and analysis coverage

`/app/data/projects` contains project requests derived from the public ngspice projects in `/app/data/originals`. The conversion changes only analysis metadata and equivalent SPICE spelling. `/app/data/CONTRACT.md` defines the exchange format and numerical tolerances.

- Bridge-T filter. Loaded passive network and complex AC response.
- BJT differential pair. DC bias, current mirror, differential DC sweep and small-signal AC about the bias.
- RCA3040 amplifier. Multistage OP, DC, AC and transient with Early effect, base series resistance, depletion capacitance, transit time and delayed SIN.
- Schmitt trigger. Hysteretic switching with finite-edge PULSE, dynamic capacitance and charge storage.
- Cascaded RTL inverters. DC transfer, saturation and transient storage through cascaded stages.

Support the demonstrated combinations of R, C, L, V, I, linear E/G, D and three-terminal NPN Gummel–Poon Q. Preserve the parameters in the supplied models, including reverse gain, Early voltage, base and collector resistance, junction capacitances and forward/reverse transit times. Generalize to other values, node names and topologies using the same grammar. For invalid or unsupported data, singular or floating circuits and nonconvergence, return a diagnostic and no successful traces.

You may implement a solver or use the provided open-source ngspice engine. Disclose the engine and version. Deliver an application with your own editing, study setup, validation, result presentation and project handling. A command wrapper, hardcoded answer cache, proprietary dependency or remote solver is outside the scope.

## C2. Web workflow

Provide the following accessible control names so the same Chromium workflow can test different implementations.

- `New project`, file inputs `Import project` for project JSON and `Import deck` for SPICE, editable `Model` and `Circuit topology` view. Support creating a working circuit in an empty editor and inserting, deleting or reconnecting devices. Show the current topology with devices and terminal nodes after edits.
- Editable `Study` and `Probes` text fields containing JSON. `Run analysis` solves the edited project. `Run status` communicates success, failure and stale results. `Result table` shows trace labels and units. `Result plot` shows swept, frequency or time-domain traces. For AC, make magnitude and phase available alongside real and imaginary data.
- `Save project` persists the editable project. The `Saved projects` dropdown lets users reopen it on the same origin after a page reload. `Export project` downloads the current JSON request. `Export result` downloads the batch-format JSON. `Export CSV` exports one row per sample, including units in headers. Disable result exports when the selected project has changed since the last success.

## C3. Delivery

Place the complete source and deliverables under `/app/output`. Include `README.md` with startup, usage, supported grammar and limitations, `LICENSE`, and `dependencies.lock` recording pinned runtime dependencies. The app must launch from a fresh copy with `bash /app/output/launch.sh --host 127.0.0.1 --port PORT`. The batch entry is `bash /app/output/simulate.sh REQUEST.json RESULT.json`. Both use the same engine and work offline. Submit regular files and directories without links, at most 6,000 entries and 128 MB total. Verification uses numerical tests, browser workflows and delivery checks. All mandatory checks must pass for reward 1.
