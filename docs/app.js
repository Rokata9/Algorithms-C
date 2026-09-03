(() => {
  "use strict";

  const G = {
    nodes: [
      { id: "s", x: 70, y: 150 },
      { id: "a", x: 220, y: 55 },
      { id: "b", x: 220, y: 245 },
      { id: "c", x: 400, y: 55 },
      { id: "d", x: 400, y: 245 },
      { id: "e", x: 550, y: 150 },
    ],
    edges: [
      { u: "s", v: "a", w: 4 },
      { u: "s", v: "b", w: 2 },
      { u: "b", v: "a", w: 1 },
      { u: "a", v: "c", w: 5 },
      { u: "b", v: "c", w: 8 },
      { u: "b", v: "d", w: 10 },
      { u: "c", v: "d", w: 2 },
      { u: "c", v: "e", w: 6 },
      { u: "d", v: "e", w: 3 },
    ],
  };
  const TRUE_D = { s: 0, a: 3, b: 2, c: 8, d: 10, e: 13 };
  const INF = 1e9;

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }
  function ink() {
    return isDark() ? "#f3eadc" : "#241c14";
  }
  function paper() {
    return isDark() ? "#221c17" : "#fffdf8";
  }
  const redrawOnTheme = [];

  function $(id) {
    return document.getElementById(id);
  }

  const HUB = {
    nodes: [
      { id: "x", x: 50, y: 50 },
      { id: "p", x: 200, y: 50 },
      { id: "q", x: 350, y: 50 },
      { id: "r", x: 500, y: 50 },
      { id: "y", x: 50, y: 160 },
      { id: "u", x: 200, y: 160 },
      { id: "v", x: 350, y: 160 },
      { id: "z", x: 50, y: 270 },
      { id: "w", x: 200, y: 270 },
    ],
    edges: [
      { u: "x", v: "p", w: 1 },
      { u: "p", v: "q", w: 1 },
      { u: "q", v: "r", w: 1 },
      { u: "y", v: "u", w: 1 },
      { u: "u", v: "v", w: 1 },
      { u: "z", v: "w", w: 1 },
    ],
  };

  function nodeMap(graph) {
    const g = graph || G;
    const m = {};
    g.nodes.forEach((n) => {
      m[n.id] = n;
    });
    return m;
  }

  function adjList(graph) {
    const g = graph || G;
    const a = {};
    g.nodes.forEach((n) => {
      a[n.id] = [];
    });
    g.edges.forEach((e) => a[e.u].push(e));
    return a;
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  function ensureMarker(svg) {
    if (svg.querySelector("#arr")) return;
    const defs = svgEl("defs");
    const m = svgEl("marker", {
      id: "arr",
      markerWidth: 8,
      markerHeight: 8,
      refX: 6,
      refY: 4,
      orient: "auto",
    });
    m.appendChild(svgEl("path", { d: "M0,0 L8,4 L0,8 z", fill: "#5e5348" }));
    defs.appendChild(m);
    svg.appendChild(defs);
  }

  function edgePoints(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const r = 24;
    return {
      x1: from.x + (dx / len) * r,
      y1: from.y + (dy / len) * r,
      x2: to.x - (dx / len) * (r + 2),
      y2: to.y - (dy / len) * (r + 2),
      mx: (from.x + to.x) / 2,
      my: (from.y + to.y) / 2,
    };
  }

  function drawGraph(svg, state) {
    svg.innerHTML = "";
    ensureMarker(svg);
    const graph = state.graph || G;
    const pos = nodeMap(graph);
    const dist = state.dist || {};
    const complete = new Set(state.complete || []);
    const frontier = new Set(state.frontier || []);
    const hubs = new Set(state.hubs || []);
    const dropped = new Set(state.dropped || []);
    const current = state.current;
    const hot = state.hotEdge;
    const pred = state.pred || {};

    graph.edges.forEach((e) => {
      const p = edgePoints(pos[e.u], pos[e.v]);
      const isHot = hot && hot.u === e.u && hot.v === e.v;
      const isPred = pred[e.v] === e.u;
      const line = svgEl("line", {
        x1: p.x1,
        y1: p.y1,
        x2: p.x2,
        y2: p.y2,
        stroke: isHot ? "#b4451e" : isPred ? "#2c6a4f" : "#5e5348",
        "stroke-width": isHot || isPred ? 3 : 2,
        "marker-end": "url(#arr)",
        opacity: isHot || isPred ? 1 : 0.7,
      });
      svg.appendChild(line);
      const label = svgEl("text", {
        x: p.mx + 8,
        y: p.my - 6,
        fill: isHot ? "#b4451e" : "#b4451e",
        "font-size": 13,
        "font-family": "Source Sans 3, sans-serif",
      });
      label.textContent = String(e.w);
      svg.appendChild(label);
    });

    graph.nodes.forEach((n) => {
      let fill = paper();
      let stroke = ink();
      let sw = 2;
      let tfill = ink();
      if (hubs.has(n.id)) {
        fill = "#2a5f73";
        stroke = "#2a5f73";
        tfill = "#fff";
      } else if (dropped.has(n.id)) {
        fill = "#9a9086";
        stroke = "#9a9086";
        tfill = "#fff";
      } else if (complete.has(n.id)) {
        fill = "#2c6a4f";
        stroke = "#2c6a4f";
        tfill = "#fff";
      } else if (frontier.has(n.id)) {
        fill = "#c9a227";
        stroke = "#8a6a10";
        tfill = "#241c14";
      }
      if (current === n.id) sw = 4;
      svg.appendChild(
        svgEl("circle", { cx: n.x, cy: n.y, r: 22, fill, stroke, "stroke-width": sw })
      );
      const t = svgEl("text", {
        x: n.x,
        y: n.y + 5,
        "text-anchor": "middle",
        fill: tfill,
        "font-size": 16,
        "font-family": "Fraunces, serif",
      });
      t.textContent = n.id;
      svg.appendChild(t);
      const dval = dist[n.id];
      const shown = dval === undefined || dval >= INF / 2 ? "?" : String(dval);
      const dt = svgEl("text", {
        x: n.x,
        y: n.y + 40,
        "text-anchor": "middle",
        fill: "#5e5348",
        "font-size": 12,
        "font-family": "Source Code Pro, monospace",
      });
      dt.textContent = shown;
      svg.appendChild(dt);
    });
  }

  /* ---------- Dijkstra stepper ---------- */
  function dijkstraSteps() {
    const adj = adjList();
    const dist = {};
    const pred = {};
    G.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    dist.s = 0;
    const complete = [];
    const inQ = new Set(G.nodes.map((n) => n.id));
    const steps = [];

    function waitingNow() {
      return [...inQ]
        .filter((v) => dist[v] < INF / 2)
        .sort((x, y) => dist[x] - dist[y] || x.localeCompare(y))
        .map((id) => ({ id, guess: dist[id] }));
    }

    function snap(caption, extra) {
      steps.push({
        dist: { ...dist },
        pred: { ...pred },
        complete: [...complete],
        frontier: waitingNow().map((x) => x.id),
        waiting: waitingNow(),
        unreached: [...inQ].filter((v) => dist[v] >= INF / 2),
        caption,
        ...extra,
      });
    }

    snap("s is the only place with a real guess. It sits alone at the top of the waiting list, so the first PICK will lock s.", {
      kind: "init",
      action: "Not picking yet — about to PICK the top of the list",
      why: "The waiting list is a priority queue: smallest guess at the top. Places with “?” are not on it yet. Locking only happens in a PICK step, never while we look at a road.",
    });

    while (inQ.size) {
      let u = null;
      let best = INF;
      inQ.forEach((v) => {
        if (dist[v] < best) {
          best = dist[v];
          u = v;
        }
      });
      if (best >= INF / 2) break;
      inQ.delete(u);
      complete.push(u);
      const roads = adj[u] || [];
      snap(
        "PICK: " +
          u +
          " was at the top of the waiting list (guess " +
          dist[u] +
          "), so we lock " +
          u +
          " in. Next we offer every road out of " +
          u +
          " before anyone else can lock.",
        {
          kind: "pick",
          current: u,
          action: "PICK — lock in " + u + " (guess " + dist[u] + ")",
          why:
            "Lock-in test: " +
            u +
            " had the smallest leftover guess. That is the whole test. We now have to offer all " +
            roads.length +
            " road(s) out of " +
            u +
            " before the next PICK. Neighbours may join the list or move up. None of them lock during those offers.",
        }
      );
      roads.forEach((e, idx) => {
        const old = dist[e.v];
        const cand = dist[u] + e.w;
        const n = idx + 1;
        const ofN = roads.length;
        if (cand < old) {
          dist[e.v] = cand;
          pred[e.v] = u;
          const firstTime = old >= INF / 2;
          const top = waitingNow()[0];
          const leftover = top
            ? " Closest leftover is " +
              top.id +
              " (guess " +
              top.guess +
              "). Still waiting: an OFFER never locks anyone."
            : "";
          const why = firstTime
            ? e.v +
              " joins the waiting list with guess " +
              cand +
              ". Joining is not locking in." +
              leftover
            : e.v +
              "’s guess dropped from " +
              old +
              " to " +
              cand +
              ". That is “reordered”: " +
              e.v +
              " moves closer to the top of the list. " +
              (ofN - n) +
              " road(s) out of " +
              u +
              " still remain, so no PICK yet." +
              leftover;
          snap("OFFER " + n + " of " + ofN + " from " + u + ": road " + u + " → " + e.v + " sets " + e.v + "’s guess to " + cand + ".", {
            kind: "offer",
            current: u,
            hotEdge: e,
            moved: firstTime ? null : e.v,
            action: "OFFER roads from " + u + " (" + n + " of " + ofN + ") — no locking",
            why,
          });
        } else {
          snap(
            "OFFER " + n + " of " + ofN + " from " + u + ": road " + u + " → " + e.v + " would be " + cand + ", which is not cheaper than " + old + ". Leave it.",
            {
              kind: "offer",
              current: u,
              hotEdge: e,
              action: "OFFER roads from " + u + " (" + n + " of " + ofN + ") — no locking",
              why:
                "This road does not change the waiting list. Remaining roads from " +
                u +
                ": " +
                (ofN - n) +
                ". Closest leftover stays waiting until the next PICK.",
            }
          );
        }
      });
    }
    snap("The lock-in order was s, then b, then a, then c, then d, then e. That is a nearest-leftover ranking. The job only needed the six numbers, not this order.", {
      kind: "done",
      action: "Done — waiting list empty",
      why: "Every place was locked by a PICK. Offers only updated guesses and the list. If you thought a should have turned green as soon as its guess hit 3, look back at the offers from b: those steps are OFFER, so a had to wait for the next PICK.",
    });
    return steps;
  }

  function bindStepper(steps, svgId, statusId, captionId, prevId, nextId, resetId, tableFn) {
    let i = 0;
    const svg = $(svgId);
    function show() {
      const st = steps[i];
      drawGraph(svg, st);
      $(statusId).textContent = "Step " + i + " / " + (steps.length - 1);
      if ($(captionId)) $(captionId).textContent = st.caption;
      $(prevId).disabled = i === 0;
      $(nextId).disabled = i === steps.length - 1;
      if (tableFn) tableFn(st);
    }
    $(prevId).addEventListener("click", () => {
      i = Math.max(0, i - 1);
      show();
    });
    $(nextId).addEventListener("click", () => {
      i = Math.min(steps.length - 1, i + 1);
      show();
    });
    $(resetId).addEventListener("click", () => {
      i = 0;
      show();
    });
    redrawOnTheme.push(show);
    show();
  }

  function fillDijPanel(st) {
    const action = $("dijAction");
    const wait = $("dijWait");
    const locked = $("dijLocked");
    const lockedEmpty = $("dijLockedEmpty");
    const unreachedEl = $("dijUnreached");
    const why = $("dijWhy");
    if (!wait) return;

    if (action) {
      action.textContent = st.action || "";
      action.className = "dij-action " + (st.kind || "");
    }
    if (why) why.textContent = st.why || "";

    if (locked) {
      locked.innerHTML = "";
      (st.complete || []).forEach((id, i) => {
        if (i) {
          const arrow = document.createElement("li");
          arrow.className = "arrow";
          arrow.textContent = "→";
          locked.appendChild(arrow);
        }
        const li = document.createElement("li");
        li.textContent = id + " " + st.dist[id];
        locked.appendChild(li);
      });
    }
    if (lockedEmpty) lockedEmpty.style.display = (st.complete || []).length ? "none" : "block";

    wait.innerHTML = "";
    const waiting = st.waiting || [];
    if (!waiting.length) {
      const li = document.createElement("li");
      li.innerHTML = "<span class=\"dij-empty\">empty</span>";
      wait.appendChild(li);
    } else {
      waiting.forEach((item, i) => {
        const li = document.createElement("li");
        if (i === 0) li.classList.add("next");
        if (st.moved === item.id) li.classList.add("moved");
        const tag = document.createElement("span");
        tag.className = "tag";
        if (st.moved === item.id) tag.textContent = "moved up";
        else if (i === 0) tag.textContent = st.kind === "offer" ? "next PICK" : "closest leftover";
        li.innerHTML = "<span>" + item.id + "</span><span>" + item.guess + "</span>";
        if (tag.textContent) li.appendChild(tag);
        wait.appendChild(li);
      });
    }

    if (unreachedEl) {
      const u = st.unreached || [];
      unreachedEl.textContent = u.length ? "Not on the list yet: " + u.join(", ") : "";
    }
  }

  bindStepper(dijkstraSteps(), "dijSvg", "dijStatus", "dijCaption", "dijPrev", "dijNext", "dijReset", fillDijPanel);

  /* ---------- Chapter 8: OFFER-only, no PICK ---------- */
  function ch8Steps() {
    const dist = {};
    const pred = {};
    G.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    dist.s = 0;
    const locked = ["s"];
    const adj = adjList();
    const steps = [];
    let layer = ["s"];

    function wouldPick() {
      let best = null;
      let bestD = INF;
      G.nodes.forEach((n) => {
        if (locked.indexOf(n.id) >= 0) return;
        if (dist[n.id] < bestD) {
          bestD = dist[n.id];
          best = n.id;
        }
      });
      return best ? { id: best, guess: bestD } : null;
    }

    function snap(caption, extra) {
      const wp = wouldPick();
      const reached = G.nodes.filter((n) => dist[n.id] < INF / 2).map((n) => n.id);
      steps.push({
        graph: G,
        dist: { ...dist },
        pred: { ...pred },
        complete: [...locked],
        frontier: reached.filter((id) => locked.indexOf(id) < 0),
        caption,
        wouldPick: wp,
        guesses: G.nodes.map((n) => ({ id: n.id, guess: dist[n.id] })),
        ...extra,
      });
    }

    snap("s is already locked. In your code the next line is PICK (closest leftover). This demo skips every PICK and only OFFERs.", {
      kind: "init",
      action: "s locked — next, OFFER only",
      why: "PICK would scan waiting[] and lock the closest leftover. We will not do that. We will run your OFFER loop from s, then from whoever got a guess, then stop.",
      layer: ["s"],
    });

    for (let round = 1; round <= 2; round++) {
      const roads = [];
      layer.forEach((u) => {
        (adj[u] || []).forEach((e) => roads.push(e));
      });
      roads.forEach((e, idx) => {
        const old = dist[e.v];
        const cand = dist[e.u] + e.w;
        if (cand < dist[e.v]) {
          dist[e.v] = cand;
          pred[e.v] = e.u;
        }
        const wp = wouldPick();
        snap(
          "OFFER " +
            e.u +
            " → " +
            e.v +
            ": guess[" +
            e.v +
            "] " +
            (old >= INF / 2 ? "?" : old) +
            " → " +
            dist[e.v] +
            ".",
          {
            kind: "offer",
            current: e.u,
            hotEdge: e,
            action: "OFFER (round " + round + ", road " + (idx + 1) + "/" + roads.length + ") — not PICK",
            why:
              "This is your inner for-loop. " +
              e.v +
              " is gold, not green: a cheaper guess is not a lock. " +
              (wp
                ? "If this were Dijkstra, the next PICK would lock " + wp.id + " (guess " + wp.guess + "). We skip that PICK."
                : "No leftover has a guess yet."),
            layer: [...layer],
          }
        );
      });
      const nextLayer = [];
      const seen = {};
      roads.forEach((e) => {
        if (dist[e.v] < INF / 2 && locked.indexOf(e.v) < 0 && !seen[e.v]) {
          seen[e.v] = 1;
          nextLayer.push(e.v);
        }
      });
      snap("End of OFFER round " + round + ". Still nobody new is locked. Layer for the next round: " + (nextLayer.join(", ") || "none") + ".", {
        kind: "round",
        action: "End of OFFER round " + round + " — still no PICK",
        why:
          round === 1
            ? "Your Dijkstra would have PICKed b by now (smallest leftover guess). We did not. Round 2 OFFERs from everyone who just got a guess."
            : "Two OFFER rounds, zero extra PICKs. a, b, c, d have guesses. Only s is locked. That is change 1.",
        layer: [...nextLayer],
      });
      layer = nextLayer;
    }
    return steps;
  }

  function fillCh8Panel(st) {
    const action = $("ch8Action");
    const would = $("ch8WouldPick");
    const layerEl = $("ch8Layer");
    const guessEl = $("ch8Guess");
    const why = $("ch8Why");
    if (!action) return;
    action.textContent = st.action || "";
    action.className = "dij-action " + (st.kind === "offer" ? "offer" : "pick");
    if (why) why.textContent = st.why || "";
    if (would) {
      would.textContent = st.wouldPick
        ? st.wouldPick.id + "  (guess " + st.wouldPick.guess + ") — we do not lock them"
        : "nobody (no leftover has a guess yet)";
    }
    if (layerEl) layerEl.textContent = (st.layer && st.layer.length ? st.layer.join(", ") : "—");
    if (guessEl) {
      guessEl.innerHTML = "";
      (st.guesses || []).forEach((g) => {
        const li = document.createElement("li");
        const val = g.guess >= INF / 2 ? "?" : g.guess;
        const locked = (st.complete || []).indexOf(g.id) >= 0;
        if (locked) li.classList.add("next");
        if (st.wouldPick && st.wouldPick.id === g.id) li.classList.add("moved");
        li.innerHTML = "<span>" + g.id + "</span><span>" + val + "</span>";
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = locked ? "locked" : st.wouldPick && st.wouldPick.id === g.id ? "Dijkstra would PICK" : "";
        if (tag.textContent) li.appendChild(tag);
        guessEl.appendChild(li);
      });
    }
  }

  bindStepper(ch8Steps(), "ch8Svg", "ch8Status", "ch8Caption", "ch8Prev", "ch8Next", "ch8Reset", fillCh8Panel);

  /* ---------- Bellman-Ford stepper ---------- */
  function bfSteps() {
    const dist = {};
    G.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    dist.s = 0;
    const steps = [];
    const pred = {};
    function snap(caption, extra) {
      const reached = G.nodes.filter((n) => dist[n.id] < INF / 2).map((n) => n.id);
      steps.push({
        dist: { ...dist },
        pred: { ...pred },
        complete: reached.filter((v) => dist[v] === TRUE_D[v]),
        frontier: reached.filter((v) => dist[v] !== TRUE_D[v]),
        caption,
        ...extra,
      });
    }
    snap("Round 0. Only s has a real guess. Next we will offer every road we can, three times. No waiting list.");
    for (let r = 1; r <= 3; r++) {
      G.edges.forEach((e) => {
        if (dist[e.u] >= INF / 2) return;
        const cand = dist[e.u] + e.w;
        if (cand < dist[e.v]) {
          dist[e.v] = cand;
          pred[e.v] = e.u;
          snap("Round " + r + ": offer " + e.u + " → " + e.v + ". Guess for " + e.v + " is now " + cand + ".", { hotEdge: e });
        }
      });
      snap(
        "End of round " +
          r +
          ". Every cheapest route that uses at most " +
          r +
          " road(s) is now correct. We still have not ranked anyone."
      );
    }
    return steps;
  }
  bindStepper(bfSteps(), "bfSvg", "bfStatus", "bfCaption", "bfPrev", "bfNext", "bfReset");

  /* ---------- Find-hubs stepper (three-chain map) ---------- */
  function hubSteps() {
    const k = 3;
    const B = 100;
    const S = ["x", "y", "z"];
    const dist = {};
    const pred = {};
    HUB.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    S.forEach((id) => {
      dist[id] = 0;
    });
    const adj = adjList(HUB);
    const steps = [];
    const W = new Set(S);
    let layer = [...S];

    function sizesNow() {
      const sizes = { x: 0, y: 0, z: 0 };
      W.forEach((v) => {
        let x = v;
        const seen = new Set();
        while (x && !seen.has(x)) {
          seen.add(x);
          if (S.includes(x)) {
            sizes[x] += 1;
            break;
          }
          x = pred[x];
        }
      });
      return sizes;
    }

    function snap(caption, extra) {
      const sizes = extra && extra.sizes ? extra.sizes : sizesNow();
      steps.push({
        graph: HUB,
        dist: { ...dist },
        pred: { ...pred },
        complete: [...S],
        frontier: [...W].filter((id) => !S.includes(id)),
        caption,
        k,
        starts: [...S],
        touched: [...W],
        layer: extra && extra.layer ? extra.layer : [...layer],
        sizes,
        ...extra,
      });
    }

    snap("Starts x, y, z are already locked (guess 0). k = 3 offer-rounds. Crowd threshold = k × 3 starts = 9. Touched so far: just the starts.", {
      kind: "init",
      action: "Ready — 3 offer-rounds from x, y, z. No PICK.",
      why: "This is not Dijkstra. We will not scan a waiting list for the closest leftover. We will offer every road out of the current layer, then the next layer, three times. Then we count who owns whom.",
      layer: [...S],
    });

    for (let round = 1; round <= k; round++) {
      const curr = [];
      const roads = [];
      layer.forEach((u) => {
        (adj[u] || []).forEach((e) => roads.push(e));
      });
      if (!roads.length) {
        snap("Offer-round " + round + ": this layer has no outgoing roads. Nothing to offer.", {
          kind: "offer",
          action: "OFFER-round " + round + " — layer has no roads",
          why: "The layer is the places we reached in the previous round. If they have no unused outgoing roads, this round adds nobody.",
          layer: [...layer],
        });
      }
      roads.forEach((e, idx) => {
        const cand = dist[e.u] + e.w;
        if (cand <= dist[e.v] && cand < B) {
          dist[e.v] = cand;
          pred[e.v] = e.u;
          curr.push(e.v);
          W.add(e.v);
        }
        snap(
          "OFFER-round " +
            round +
            ", road " +
            (idx + 1) +
            " of " +
            roads.length +
            ": " +
            e.u +
            " → " +
            e.v +
            ". Guess[" +
            e.v +
            "] = " +
            dist[e.v] +
            ". parent[" +
            e.v +
            "] = " +
            e.u +
            ".",
          {
            kind: "offer",
            current: e.u,
            hotEdge: e,
            action: "OFFER-round " + round + " (" + (idx + 1) + " of " + roads.length + ") — no PICK",
            why:
              "Same offer as in your Dijkstra. We do not lock " +
              e.v +
              ". It just joins the touched set. After this round we will check touched vs 9.",
            layer: [...layer],
          }
        );
      });
      const crowd = W.size > k * S.length;
      snap(
        "End of offer-round " +
          round +
          ". Touched " +
          W.size +
          " places. Threshold is 9. " +
          (crowd ? "Already a crowd — we would keep every start and stop." : "Not a crowd yet (" + W.size + " ≤ 9), so we continue."),
        {
          kind: crowd ? "crowd" : "round",
          action: "Check: touched " + W.size + " vs threshold 9",
          why: crowd
            ? "Early exit: the start list is already small compared with how many places we reached. Keep x, y, and z. No counting."
            : "We still have offer-rounds left, or we will count parent[] after round 3. Layer for the next round = the neighbours we just reached.",
          layer: [...curr],
        }
      );
      if (crowd) return steps;
      layer = curr;
    }

    snap("Offer-rounds done. Follow parent[] from every touched place until you hit a start. That start owns this place. Count.", {
      kind: "count",
      action: "Count: follow parent[] back to a start",
      why: "parent is the green arrows: p←x, q←p, r←q, u←y, v←u, w←z. Each place adds 1 to exactly one start. A start is a hub if it owns at least k = 3 places (including itself).",
      layer: [],
    });

    const sizes = sizesNow();
    ["x", "y", "z"].forEach((id) => {
      const names = { x: "x, p, q, r", y: "y, u, v", z: "z, w" };
      snap(
        "Start " +
          id +
          " owns " +
          sizes[id] +
          " place(s): " +
          names[id] +
          ". Hub test: own at least k = 3? " +
          (sizes[id] >= k ? "yes — keep " + id : "no — drop " + id) +
          ".",
        {
          kind: "count",
          action: "Count " + id + ": owns " + sizes[id] + (sizes[id] >= k ? " ≥ 3 → hub" : " < 3 → drop"),
          why:
            id === "z"
              ? "w is only one road from z. After 3 offer-rounds, w already has the right guess. We do not keep z as a source. Remaining unfinished work (if this map were longer) would go through x and y, the long chains."
              : id + "’s chain is long enough that we treat " + id + " as a hub: later work still starts from here, not from every gold place.",
          sizes,
          layer: [],
        }
      );
    });

    snap("Keep hubs {x, y}. Drop z. The rest of the algorithm only uses x and y as starts. We never ranked p, q, r, u, v, w on a waiting list.", {
      kind: "done",
      action: "Done — keep x, y. Drop z.",
      why: "That is change 1 from chapter 8: the start list shrank from 3 to 2 without a PICK. Change 2 (take a handful of closest hubs, not one) comes next.",
      hubs: ["x", "y"],
      dropped: ["z"],
      sizes,
      layer: [],
    });
    return steps;
  }

  function fillHubPanel(st) {
    const action = $("pvAction");
    const meta = $("pvMeta");
    const layerEl = $("pvLayer");
    const parentsEl = $("pvParents");
    const sizesEl = $("pvSizes");
    const hubsEl = $("pvHubs");
    const why = $("pvWhy");
    if (!action) return;
    action.textContent = st.action || "";
    action.className = "dij-action " + (st.kind === "offer" ? "offer" : st.kind === "done" ? "done" : "pick");
    if (why) why.textContent = st.why || "";
    const th = (st.k || 3) * (st.starts ? st.starts.length : 3);
    if (meta) {
      meta.textContent =
        "k=" +
        (st.k || 3) +
        "   starts=" +
        (st.starts || []).join(",") +
        "   touched=" +
        (st.touched || []).length +
        "   threshold=" +
        th;
    }
    if (layerEl) layerEl.textContent = (st.layer && st.layer.length ? st.layer.join(", ") : "—");
    if (parentsEl) {
      const pred = st.pred || {};
      const bits = Object.keys(pred)
        .sort()
        .map((id) => id + "←" + pred[id]);
      parentsEl.textContent = bits.length ? bits.join("   ") : "none yet";
    }
    if (sizesEl) {
      sizesEl.innerHTML = "";
      const sizes = st.sizes || {};
      ["x", "y", "z"].forEach((id) => {
        const li = document.createElement("li");
        const n = sizes[id] || 0;
        const keep = n >= (st.k || 3);
        if (st.kind === "done" || st.kind === "count") {
          if (keep) li.classList.add("next");
        }
        li.innerHTML = "<span>" + id + "</span><span>" + n + "</span>";
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = st.kind === "init" || st.kind === "offer" || st.kind === "round" ? "" : keep ? "hub" : "drop";
        if (tag.textContent) li.appendChild(tag);
        sizesEl.appendChild(li);
      });
    }
    if (hubsEl) {
      if (st.hubs && st.hubs.length) hubsEl.textContent = st.hubs.join(", ");
      else if (st.kind === "crowd") hubsEl.textContent = "all starts (early exit)";
      else hubsEl.textContent = "not decided yet";
    }
  }

  bindStepper(hubSteps(), "pvSvg", "pvStatus", "pvCaption", "pvPrev", "pvNext", "pvReset", fillHubPanel);

  /* ---------- Chapter 8: handful vs one ---------- */
  (function handfulDemo() {
    const list = $("handfulList");
    const note = $("hfNote");
    if (!list) return;
    const items = [
      { id: "b", t: 2 },
      { id: "g", t: 3 },
      { id: "a", t: 4 },
      { id: "f", t: 7 },
      { id: "c", t: 10 },
      { id: "d", t: 12 },
      { id: "h", t: 15 },
      { id: "e", t: 20 },
    ];
    function render(taken, mode) {
      list.innerHTML = "";
      items.forEach((it) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "place" + (taken.indexOf(it.id) >= 0 ? (mode === "new" ? " batch" : " taken") : "");
        b.innerHTML = it.id + "<span class=\"t\">guess " + it.t + "</span>";
        list.appendChild(b);
      });
      if (!taken.length) {
        note.textContent = "Each tile is a leftover place and its guess. Nothing is locked yet.";
      } else if (mode === "dij") {
        note.textContent =
          "Dijkstra PICK: only " +
          taken[0] +
          " (smallest guess). To do that it had to know who the single closest was — the ranking question.";
      } else {
        note.textContent =
          "New PICK: the three closest (" +
          taken.join(", ") +
          "). The other five stay unsorted among themselves. Weaker question, cheaper.";
      }
    }
    render([], "");
    $("hfDij").addEventListener("click", () => {
      const one = items.slice().sort((x, y) => x.t - y.t)[0].id;
      render([one], "dij");
    });
    $("hfNew").addEventListener("click", () => {
      const three = items
        .slice()
        .sort((x, y) => x.t - y.t)
        .slice(0, 3)
        .map((x) => x.id);
      render(three, "new");
    });
    $("hfReset").addEventListener("click", () => render([], ""));
  })();

  /* ---------- Worked walk-through ---------- */
  function walkSteps() {
    const story = [
      {
        dist: { s: 0, a: INF, b: INF, c: INF, d: INF, e: INF },
        complete: ["s"],
        frontier: ["s"],
        pred: {},
        caption: "Top call: starts = {s}, no time limit. s is locked in at 0. Everyone else is still huge.",
      },
      {
        dist: { s: 0, a: 4, b: 2, c: INF, d: INF, e: INF },
        complete: ["s"],
        frontier: ["s", "a", "b"],
        pred: { a: "s", b: "s" },
        hotEdge: { u: "s", v: "b", w: 2 },
        caption: "Find hubs, shout 1: s offers a (4) and b (2). Both join the touched set.",
      },
      {
        dist: { s: 0, a: 3, b: 2, c: 10, d: 12, e: INF },
        complete: ["s", "b"],
        frontier: ["s", "a", "b", "c", "d"],
        pred: { a: "b", b: "s", c: "b", d: "b" },
        caption: "Shout 2: b improves a to 3 and offers c=10, d=12. s is the hub we will expand from.",
      },
      {
        dist: { s: 0, a: 3, b: 2, c: 10, d: 12, e: INF },
        complete: ["s", "a", "b"],
        frontier: ["c", "d"],
        pred: { a: "b", b: "s", c: "b", d: "b" },
        current: "s",
        caption: "A smaller job (the tiny walk) locks the closest cluster {s, b, a}. Times 0, 2, 3 are done. The pile will get the places just beyond that cluster.",
      },
      {
        dist: { s: 0, a: 3, b: 2, c: 8, d: 12, e: INF },
        complete: ["s", "a", "b"],
        frontier: ["c", "d"],
        pred: { a: "b", b: "s", c: "a", d: "b" },
        hotEdge: { u: "a", v: "c", w: 5 },
        caption: "Offer roads from the finished cluster. a → c improves c from 10 to 8. Put c (and later d) on the pile — not on a fully ranked list of everyone leftover.",
      },
      {
        dist: { s: 0, a: 3, b: 2, c: 8, d: 10, e: 14 },
        complete: ["s", "a", "b", "c", "d"],
        frontier: ["e"],
        pred: { a: "b", b: "s", c: "a", d: "c", e: "c" },
        caption: "Grab the next close group. That job locks c, then d (via c → d, 8+2=10). e is offered 14 from c.",
      },
      {
        dist: { s: 0, a: 3, b: 2, c: 8, d: 10, e: 13 },
        complete: ["s", "a", "b", "c", "d", "e"],
        frontier: [],
        pred: { a: "b", b: "s", c: "a", d: "c", e: "d" },
        hotEdge: { u: "d", v: "e", w: 3 },
        caption: "Last group locks e via d → e (10+3=13). The pile is empty, so we are done. Same numbers as Dijkstra. We never kept a full ranking of the waiting list.",
      },
    ];
    return story;
  }
  bindStepper(walkSteps(), "wSvg", "wStatus", "wCaption", "wPrev", "wNext", "wReset");

  /* ---------- Flowchart captions ---------- */
  const flowText = {
    start: "One call of the job. You get some already-locked-in starts and a time limit. Finish every place whose cheapest route goes through those starts and whose time is under the limit. If that is too much work, finish only the closest chunk and return a tighter limit.",
    base: "Smallest kind of job: one locked-in place. Walk like Dijkstra from there, but stop after a handful of places, and do not walk past the time limit. A tiny waiting list of a handful of items is cheap. A waiting list of every place in the city is not.",
    pivots: "Shout a few times from the current starts. Short detours get locked in. What is left hangs off a few busy intersections (hubs). The rest of the algorithm only expands from hubs.",
    loop: "Grab a handful of the closest remaining hubs from the pile, plus a cutoff. Repeat this whole job on that smaller group. Each group is a nearer slice of leftover times. Groups do not overlap.",
    relax: "When a smaller job returns, offer roads out of the places it locked in. Neighbours that got cheaper go back on the pile. If they are closer than the group you just did, dump them on the front — you already know they belong before the rest.",
  };
  document.querySelectorAll("[data-flow]").forEach((g) => {
    g.addEventListener("click", () => {
      $("flowCaption").textContent = flowText[g.getAttribute("data-flow")];
    });
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tabs").forEach((tabBar) => {
    tabBar.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pane = btn.getAttribute("data-pane");
        tabBar.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
        const parent = tabBar.parentElement;
        parent.querySelectorAll(".pane").forEach((p) => {
          p.hidden = p.id !== pane;
        });
      });
    });
  });

  /* ---------- Quizzes ---------- */
  document.querySelectorAll(".quiz").forEach((q) => {
    const ans = Number(q.getAttribute("data-answer"));
    q.querySelectorAll(".choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (q.classList.contains("answered")) return;
        q.classList.add("answered");
        q.querySelectorAll(".choice").forEach((b) => {
          const i = Number(b.getAttribute("data-i"));
          if (i === ans) b.classList.add("correct");
          if (b === btn && i !== ans) b.classList.add("wrong");
        });
      });
    });
  });

  /* ---------- Checklist ---------- */
  const plan = $("plan");
  if (plan) {
    plan.querySelectorAll("input[type=checkbox]").forEach((box) => {
      const key = "bmssp-plan-" + box.getAttribute("data-k");
      box.checked = localStorage.getItem(key) === "1";
      box.addEventListener("change", () => {
        localStorage.setItem(key, box.checked ? "1" : "0");
      });
    });
  }
  $("resetBtn").addEventListener("click", () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("bmssp-plan-"))
      .forEach((k) => localStorage.removeItem(k));
    if (plan) plan.querySelectorAll("input").forEach((b) => (b.checked = false));
  });

  /* ---------- Theme ---------- */
  const themeBtn = $("themeBtn");
  const savedTheme = localStorage.getItem("bmssp-theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    if (cur === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("bmssp-theme", cur === "dark" ? "dark" : "");
    redrawOnTheme.forEach((fn) => fn());
  });

  /* ---------- TOC + progress ---------- */
  const links = [...document.querySelectorAll("nav.toc a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const progress = $("progress");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? window.scrollY / max : 0) * 100 + "%";
    let current = sections[0];
    sections.forEach((sec) => {
      if (sec.getBoundingClientRect().top < 120) current = sec;
    });
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current.id));
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
