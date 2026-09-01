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

  function nodeMap() {
    const m = {};
    G.nodes.forEach((n) => {
      m[n.id] = n;
    });
    return m;
  }

  function adjList() {
    const a = {};
    G.nodes.forEach((n) => {
      a[n.id] = [];
    });
    G.edges.forEach((e) => a[e.u].push(e));
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
    const pos = nodeMap();
    const dist = state.dist || {};
    const complete = new Set(state.complete || []);
    const frontier = new Set(state.frontier || []);
    const current = state.current;
    const hot = state.hotEdge;
    const pred = state.pred || {};

    G.edges.forEach((e) => {
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

    G.nodes.forEach((n) => {
      let fill = paper();
      let stroke = ink();
      let sw = 2;
      let tfill = ink();
      if (complete.has(n.id)) {
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

  /* ---------- FindPivots stepper ---------- */
  function pivotSteps() {
    const k = 2;
    const B = 20;
    const S = ["s"];
    const dist = {};
    const pred = {};
    G.nodes.forEach((n) => {
      dist[n.id] = INF;
    });
    dist.s = 0;
    const adj = adjList();
    const steps = [];
    let W = new Set(S);
    let prev = [...S];

    function snap(caption, extra) {
      steps.push({
        dist: { ...dist },
        pred: { ...pred },
        complete: [...W].filter((v) => dist[v] === TRUE_D[v]),
        frontier: [...W],
        caption,
        ...extra,
      });
    }

    snap("Find hubs, toy setting: 2 shouts from s, ignore guesses past 20. Touched so far: just s.");
    let worldA = false;
    for (let i = 1; i <= k; i++) {
      const curr = [];
      prev.forEach((u) => {
        (adj[u] || []).forEach((e) => {
          const cand = dist[u] + e.w;
          if (cand <= dist[e.v]) {
            dist[e.v] = cand;
            pred[e.v] = u;
            if (cand < B) {
              curr.push(e.v);
              W.add(e.v);
            }
            snap("Shout " + i + ": offer " + e.u + " → " + e.v + ". Guess " + cand + ". Touched: " + [...W].join(", ") + ".", {
              current: u,
              hotEdge: e,
            });
          }
        });
      });
      if (W.size > k * S.length) {
        worldA = true;
        snap(
          "End of shout " +
            i +
            ". We touched " +
            W.size +
            " places, starting from 1 boundary place, with k = 2. That is already a crowd compared with the boundary, so the whole boundary can act as hubs. Here that is just s. We do not need to inspect family trees."
        );
        break;
      }
      snap("End of shout " + i + ". Touched " + W.size + " places, still not a crowd. Shout again.");
      prev = curr;
    }
    if (!worldA) {
      const sizes = {};
      G.nodes.forEach((n) => {
        sizes[n.id] = 0;
      });
      [...W].forEach((v) => {
        let x = v;
        const seen = new Set();
        while (x && W.has(x) && !seen.has(x)) {
          sizes[x] = (sizes[x] || 0) + 1;
          seen.add(x);
          if (S.includes(x)) break;
          x = pred[x];
        }
      });
      const P = S.filter((u) => (sizes[u] || 0) >= k);
      snap(
        "The other case: family trees from the boundary. " +
          S.map((u) => u + " currently owns " + (sizes[u] || 0) + " place(s)").join("; ") +
          ". Hubs = {" +
          (P.join(", ") || "none") +
          "} (roots that own at least " +
          k +
          " places)."
      );
    } else {
      snap(
        "The other case, for contrast: if we had only touched a few places, we would follow parent pointers and keep only roots whose family tree has at least 2 places. Those roots are the hubs. The next step of the algorithm expands only from hubs, not from every boundary place."
      );
    }
    return steps;
  }
  bindStepper(pivotSteps(), "pvSvg", "pvStatus", "pvCaption", "pvPrev", "pvNext", "pvReset");

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
