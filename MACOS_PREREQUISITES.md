# macOS prerequisites

Install these once. After that, open any `.c` file that defines `main` and run or debug it.

Explainers in `docs/` are HTML. They do not need a compiler.

## 1. Apple Command Line Tools

This gives you `clang` (the C compiler) and `lldb` (the debugger).

```bash
xcode-select --install
```

A macOS dialog appears. Click **Install** and wait. Full Xcode from the App Store is not required.

Check that it worked:

```bash
clang --version
lldb --version
xcode-select -p
```

You should see a clang version, an lldb version, and a path such as `/Library/Developer/CommandLineTools` or `/Applications/Xcode.app/Contents/Developer`.

If `clang` is missing after install, run:

```bash
sudo xcode-select --reset
xcode-select --install
```

If the compiler prints a license error, accept Apple’s license once:

```bash
sudo xcodebuild -license accept
```

## 2. Visual Studio Code

Download from [https://code.visualstudio.com](https://code.visualstudio.com) or, if you use Homebrew:

```bash
brew install --cask visual-studio-code
```

Open this project with the workspace file:

```bash
open algorithms.code-workspace
```

Or in VS Code: **File → Open Workspace from File…** and pick `algorithms.code-workspace`.

## 3. VS Code extensions

When you open the workspace, VS Code should offer **Install Recommended Extensions**. Install all of them.

If the prompt does not appear, install these from the Extensions view (`Cmd+Shift+X`):

| Extension | Identifier | Why |
|---|---|---|
| C/C++ | `ms-vscode.cpptools` | Syntax, IntelliSense, `#include` navigation |
| C/C++ Extension Pack | `ms-vscode.cpptools-extension-pack` | C/C++ plus extras |
| CodeLLDB | `vadimcn.vscode-lldb` | Debugger that works well with Apple `lldb` |
| Code Runner | `formulahendry.code-runner` | Right-click a `.c` file → **Run Code** |
| Makefile Tools | `ms-vscode.makefile-tools` | Optional; understands the `Makefile` |

From a terminal you can also run:

```bash
code --install-extension ms-vscode.cpptools
code --install-extension ms-vscode.cpptools-extension-pack
code --install-extension vadimcn.vscode-lldb
code --install-extension formulahendry.code-runner
code --install-extension ms-vscode.makefile-tools
```

If `code` is not found, in VS Code open the Command Palette (`Cmd+Shift+P`) and run **Shell Command: Install 'code' command in PATH**.

## 4. Developer Tools privacy (only if debugging is blocked)

On some macOS versions, attaching a debugger to a program you just compiled requires an extra permission.

1. Open **System Settings → Privacy & Security → Developer Tools**.
2. Enable **Visual Studio Code** (and **Terminal** if you debug from the shell).
3. Quit and reopen VS Code.

You do not need to disable SIP, Gatekeeper, or codesign your binary. `clang -g` output is debuggable as-is.

## 5. Homebrew (optional)

You do not need Homebrew, Python, Node, or CMake. Apple `clang` is enough.

## 6. Intel Macs

The IntelliSense mode in `.vscode/c_cpp_properties.json` is set to `macos-clang-arm64` (Apple Silicon). On an Intel Mac, change that value to `macos-clang-x64` in:

- `.vscode/c_cpp_properties.json`
- `.vscode/settings.json` (`C_Cpp.default.intelliSenseMode`)

Compiling and debugging still work if you forget; only the squiggle engine’s architecture hint is wrong.

## 7. Verify the whole chain

From the project root:

```bash
make clean
make run FILE=playground.c
echo $?
```

The program should print nothing and exit with status `0`.

Then in VS Code:

1. Open `playground.c`.
2. Click the gutter to the left of `return 0;` to set a breakpoint (a red dot).
3. Press **F5**.
4. The debugger should stop on that line.

Right-click `playground.c` (or any later `trees/walk.c`, `graphs/dijkstra.c`, …) and choose **Run Code**. That compiles **that file** plus helpers:

- `.c` files in the **same folder** that do not define `main`
- `.c` files at the **repo root** that do not define `main`

Two files in the same folder that both define `main` stay independent. Running `graphs/dijkstra.c` will not compile `graphs/bmssp.c`.

## 8. Daily keys after setup

| Action | How |
|---|---|
| Build the open file | `Cmd+Shift+B` |
| Run | right-click the `.c` file → **Run Code**, or `Ctrl+Option+N`, or `make run FILE=path/to/file.c` |
| Debug | **F5** (builds that file first, then lldb) |
| Stop | `Shift+F5` |
| Step over / into / out | `F10` / `F11` / `Shift+F11` |
| Clean | Command Palette → **Tasks: Run Task** → `clean` |

New topic: `mkdir stacks` (any name). Put a `.c` file with `main` in it. No VS Code config change.

Shared types: put them in `types.h` at the root, or in a header next to the `.c` file. `#include "types.h"` works from every folder.

## 9. If something fails

**`clang: command not found`**
Run section 1 again. Confirm `which clang` prints `/usr/bin/clang`.

**`make: command not found`**
`make` ships with the Command Line Tools. Same fix as clang.

**“does not define main()”**
You ran a helper `.c` file. Run the file that contains `int main`. Helpers are linked when you run the program file.

**`duplicate symbol _main`**
Two of the files being compiled define `main`. Keep `main` in the program file only. Helpers must not define `main`.

**F5 says it cannot find the binary under `build/`**
The build task failed, or you pressed F5 on a non-`.c` file. Open the `.c` file with `main`, check **View → Problems** and **View → Terminal**, then press F5 again.

**F5 says it cannot find the `lldb` debug type**
Install the **CodeLLDB** extension (`vadimcn.vscode-lldb`). Reload VS Code. As a backup, the workspace also has **Debug current file (Microsoft C/C++ fallback)** in the Run and Debug dropdown.

**Right-click has no “Run Code”**
Install **Code Runner**. Reload. The command is also in the Command Palette as **Run Code**.

**IntelliSense cannot find `types.h`**
You opened a single file instead of the workspace. Open `algorithms.code-workspace`.

**Debugger never hits breakpoints**
Confirm you built with the workspace script (flags include `-g -O0`). Do not add `-O2` while debugging.

**`undefined reference` to a function in another file**
That other file either defines `main` (so it was skipped as a second program) or lives in a different folder. Move helpers next to the program, or to the repo root, and do not give them a `main`.
