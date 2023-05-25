const fs = require("fs");
const path = require("path");

// Example usage:
const inputFileName = process.argv[2];
if (!inputFileName) {
  console.error(
    "Please provide an input file path as a command-line argument."
  );
  process.exit(1);
}

fs.readFile(inputFileName, "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const lines = data.split("\n");
  const newLines = [];

  let currentLine = "";
  for (const line of lines) {
    const parts = line.split(" ");
    if (parts.length === 2) {
      if (currentLine) {
        newLines.push(currentLine.trim());
      }
      currentLine = line;
    } else {
      currentLine += " " + line;
    }
  }
  newLines.push(currentLine.trim());

  const newContent = newLines.join("\n");

  main(newContent);
});

function writeOutput(output) {
  fs.writeFile(
    path.join(
      "data",
      path.basename(inputFileName, path.extname(inputFileName)) + ".txt.out.txt"
    ),
    output,
    "utf8",
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
}

const NS = 36;

function main(input) {
  const [C, P, ...data] = input.trim().split(/\s+/);
  const contributors = parseInt(C);
  const projects = parseInt(P);

  let dataIndex = 0;
  const Cnames = [],
    Pnames = [];
  const s2i = new Map();
  const skill = Array(contributors)
    .fill()
    .map(() => Array(NS).fill(0));
  const ts = Array(contributors).fill(0);
  const req = Array(projects)
    .fill()
    .map(() => []);
  const D = [],
    S = [],
    B = [];

  for (let c = 0; c < contributors; ++c) {
    const name = data[dataIndex++];
    const n = parseInt(data[dataIndex++]);
    Cnames.push(name);
    for (let i = 0; i < n; ++i) {
      const s = data[dataIndex++];
      const l = parseInt(data[dataIndex++]);
      if (!s2i.has(s)) s2i.set(s, s2i.size);
      skill[c][s2i.get(s)] = l;
      ts[c] += l;
    }
  }

  for (let p = 0; p < projects; ++p) {
    const name = data[dataIndex++];
    const d = parseInt(data[dataIndex++]);
    const s = parseInt(data[dataIndex++]);
    const b = parseInt(data[dataIndex++]);
    const r = parseInt(data[dataIndex++]);
    D.push(d);
    S.push(s);
    B.push(b);
    Pnames.push(name);
    for (let i = 0; i < r; ++i) {
      const s = data[dataIndex++];
      const l = parseInt(data[dataIndex++]);
      if (!s2i.has(s)) s2i.set(s, s2i.size);
      req[p].push([s2i.get(s), l]);
    }
  }

  const findSolutions = (seed) => {
    const skill0 = skill.map((row) => row.slice());
    const ts0 = ts.slice();

    let score = 0;
    const sol = [];

    const av = Array(contributors).fill(0);
    const order = Array.from({ length: projects }, (_, i) => i);
    const chosen = Array(contributors).fill(false);
    const mt = new Intl.Collator(seed);
    const ckey = (c, m, s, l) => [Math.max(av[c], m), skill[c][s], ts[c]];

    while (true) {
      let bad = true;
      const fail = [];

      for (const p of order.sort(() => 0.5 - Math.random())) {
        let mav = 0;
        const cs = Array(req[p].length).fill(0);
        const cs2 = [],
          ro = Array.from(cs.keys());
        const ms = Array(NS).fill(0);
        let good = true;

        for (let test = 0; test < 100 && good; ++test) {
          ro.sort(() => 0.5 - Math.random());
          ms.fill(0);
          mav = 0;
          good = true;

          for (const o of ro) {
            const [s, l] = req[p][o];
            let l0 = l;
            if (ms[s] >= l) l0 = l - 1;

            let best = -1;
            for (let c = 0; c < contributors; ++c) {
              if (!chosen[c] && skill[c][s] >= l) {
                if (
                  best === -1 ||
                  ckey(c, mav, s, l0) < ckey(best, mav, s, l0)
                ) {
                  best = c;
                }
              }
            }
            if (best === -1) {
              good = false;
              break;
            }
            cs[o] = best;
            for (let i = 0; i < s2i.size; ++i)
              ms[i] = Math.max(ms[i], skill[best][i]);
            chosen[best] = true;
            mav = Math.max(mav, av[best]);
          }

          for (const c of cs) chosen[c] = false;
          const end = mav + D[p];
          if (good && end < B[p] + S[p]) {
            cs2.push(...cs);
            break;
          }
        }

        const end = mav + D[p];
        if (cs2.length === 0 || end >= B[p] + S[p]) {
          fail.push(p);
          continue;
        }

        for (let i = 1; i < cs.length; ++i) {
          if (skill[cs[i]][req[p][i][0]] > req[p][i][1]) {
            for (let j = 0; j < i; ++j) {
              if (skill[cs[j]][req[p][j][0]] > req[p][j][1]) {
                if (
                  skill[cs[i]][req[p][j][0]] >= req[p][j][1] - 1 &&
                  skill[cs[j]][req[p][i][0]] >= req[p][i][1] - 1
                ) {
                  [cs[i], cs[j]] = [cs[j], cs[i]];
                }
              }
            }
          }
        }

        score += S[p] - Math.max(0, end - B[p]);
        for (let i = 0; i < cs.length; ++i) {
          av[cs[i]] = end;
          const [s, l] = req[p][i];
          if (skill[cs[i]][s] <= l) {
            skill[cs[i]][s]++;
            ts[cs[i]]++;
          }
        }
        sol.push([p, cs]);
        bad = false;
      }

      if (bad) break;
      order.length = 0;
      order.push(...fail);
    }

    skill.length = 0;
    skill.push(...skill0);
    ts.length = 0;
    ts.push(...ts0);

    return [score, sol];
  };

  let score = -1;
  let sol;
  let T = 10000;

  function runIteration() {
    if (Date.now() >= endTime) {
      const output =
        sol.length +
        "\n" +
        sol
          .map(
            ([p, cs]) => Pnames[p] + "\n" + cs.map((c) => Cnames[c]).join(" ")
          )
          .join("\n");
      writeOutput(output);
      return;
    }

    const [sc, so] = findSolutions(T);
    if (sc > score) {
      score = sc;
      sol = so;
    }

    setTimeout(runIteration, 0);
  }

  const endTime = Date.now() + 5 * 60 * 1000; // Run for 5 minutes
  setTimeout(() => {
    const output =
      sol.length +
      "\n" +
      sol
        .map(([p, cs]) => Pnames[p] + "\n" + cs.map((c) => Cnames[c]).join(" "))
        .join("\n");
    writeOutput(output);
  }, 5 * 60 * 1000);

  runIteration();
}
