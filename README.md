# Algorithms

A flat C workspace for practising algorithms. Each topic is a folder. Each program is a `.c` file with `main`. Run or debug that file; helpers in the same folder (and at the repo root) are linked automatically.

The BMSSP / sorting-barrier explainer is in [docs/index.html](docs/index.html). It is a reading note, not the shape of this project.

## Layout

```
playground.c          scratch file (has main)
types.h               shared types, visible from every folder

arrays/
trees/
graphs/               put dijkstra.c, bmssp.c, …
recursion/
…
docs/                 explainers (browser)
```

Add a new topic by making a new folder at the top level. No `src/`, no extra nesting.

## How a program is built

You run **one** `.c` file that defines `main`. The build also pulls in:

1. Other `.c` files **in that same folder** that do **not** define `main` (helpers).
2. `.c` files **at the repo root** that do **not** define `main` (shared helpers).

Headers are found in the repo root (`#include "types.h"`) and in the file’s own folder (`#include "graph.h"`).

Example:

```
graphs/
  graph.h
  graph.c          no main → helper, always linked with graph programs
  dijkstra.c       has main → right-click this to run Dijkstra
  bmssp.c          has main → right-click this to run BMSSP
```

`dijkstra.c` compiles with `graph.c`, not with `bmssp.c`. Two programs in one folder do not collide.

## Run and debug (macOS / VS Code)

Install tools from [MACOS_PREREQUISITES.md](MACOS_PREREQUISITES.md), then open [algorithms.code-workspace](algorithms.code-workspace).

| Action | How |
|---|---|
| Build the open `.c` file | `Cmd+Shift+B` |
| Run it | Right-click the file → **Run Code**, or `Ctrl+Option+N` |
| Debug it | **F5** (builds that file first, then lldb) |
| From a terminal | `make run FILE=graphs/dijkstra.c` |

Do not use **C/C++: Run File** / **Debug C/C++ File**. Those compile only the open file and skip helpers. Use **Run Code** and **F5**.

## Start a new algorithm

1. Pick (or create) a topic folder.
2. Add `trees/walk.c` with `int main(void) { return 0; }`.
3. `#include "types.h"` and any local headers.
4. Press **F5**.
