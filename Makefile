# Build/run the current algorithm file.
#   make run FILE=graphs/dijkstra.c
#   make FILE=playground.c
# VS Code always passes the open editor file, so you normally just press keys.

FILE ?= playground.c

.PHONY: build run clean explain

build:
	./scripts/build.sh $(FILE)

run:
	./scripts/run.sh $(FILE)

clean:
	rm -rf build

explain:
	open docs/index.html
