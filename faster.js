const fs = require("fs");
range = (f) => [...Array(f).keys()];
function getStructure(fileName) {
  const rows = fs.readFileSync(fileName, { encoding: "ascii" }).split("\n");
  const [numDevs, numProjects] = rows
    .shift()
    .split(" ")
    .map((s) => Number.parseInt(s));
  const devs = [];
  for (const _ of range(numDevs)) {
    const [name, numSkills] = rows.shift().split(" ");
    const skills = [];
    for (const __ of range(Number(numSkills))) {
      const [name, lv] = rows.shift().split(" ");
      skills.push({ name, initLv: Number(lv), currentLv: Number(lv) });
    }
    devs.push({ name, skills });
  }
  const projects = [];
  for (const _ of range(numProjects)) {
    const [name, duration, fullScore, bestBefore, numSkills] = rows
      .shift()
      .split(" ");
    const reqSkills = [];
    for (const __ of range(Number(numSkills))) {
      const [name, lv] = rows.shift().split(" ");
      reqSkills.push({ name, lv: Number(lv) });
    }
    projects.push({
      name,
      duration: Number(duration),
      fullScore: Number(fullScore),
      bestBefore: Number(bestBefore),
      actualScore: Number(bestBefore),
      reqSkills,
    });
  }
  return { devs, projects };
}
function writeResult(projectsCompleted, outfileName) {
  const porjectsNum = projectsCompleted.length.toString();
  let resString = porjectsNum + "\n";
  for (let idx = 0; idx < projectsCompleted.length; idx++) {
    const projectCompleted = projectsCompleted[idx];
    resString += projectCompleted.name;
    resString += "\n";
    resString += projectCompleted.roles.join(" ");
    if (idx !== projectsCompleted.length - 1) resString += "\n";
  }
  try {
    fs.writeFileSync(outfileName, resString);
  } catch (err) {
    console.error(err);
  }
}
function getSkillLv(dev, skillName) {
  const skill = dev.skills.find((s) => s.name === skillName);
  return skill ? skill.currentLv : 0;
}
// Add memoization for getRightDevs
const memoGetRightDevs = (() => {
  const cache = new Map();
  return (devs, project) => {
    const key = devs.map((d) => d.name).join(",") + "_" + project.name;
    if (!cache.has(key)) {
      cache.set(key, getRightDevs(devs, project));
    }
    return cache.get(key);
  };
})();

// Modify the getRightDevs function to avoid filtering the developers array
function getRightDevs(devs, project) {
  const toRet = [];
  const avDevs = [...devs];
  for (const skill of project.reqSkills) {
    let chosenDev = null;
    let minLvDifference = Infinity;
    let minLvIndex = -1;
    for (let i = 0; i < avDevs.length; i++) {
      const dev = avDevs[i];
      const lvDifference = getSkillLv(dev, skill.name) - skill.lv;
      if (lvDifference >= 0 && lvDifference < minLvDifference) {
        minLvDifference = lvDifference;
        chosenDev = dev;
        minLvIndex = i;
      }
    }
    if (chosenDev) {
      toRet.push(chosenDev);
      avDevs.splice(minLvIndex, 1);
    } else return [];
  }
  return toRet;
}
function optimizeSimplified(devs, projects) {
  const orderedProject = projects.sort(
    (pr1, pr2) => pr1.duration - pr2.duration
  );
  const toRet = [];
  const upperBound = orderedProject.length * 2;
  let i = 0;
  for (const project of orderedProject) {
    if (i++ > upperBound) break;
    const rightDevs = getRightDevs(devs, project);
    if (rightDevs.length > 0) {
      const rightDevsNames = rightDevs.map((d) => {
        return d.name;
      });
      toRet.push({
        name: project.name,
        roles: rightDevsNames,
      });
    } else {
      orderedProject.push(project);
    }
  }
  return toRet;
}
function quality(solution, projects) {
  return solution.reduce(
    (acc, project) =>
      acc + projects.find((pr) => pr.name === project.name).actualScore,
    0
  );
}
// Modify the grasp function to use memoGetRightDevs and optimize quality comparison
function grasp(
  devs,
  projects,
  p = 0.5,
  maxIterations = 100,
  duration = 300000
) {
  let bestSolution = null;
  let bestQuality = -Infinity;
  let iteration = 0;

  const numProjectsToConsider = Math.ceil(projects.length * p);
  const startTime = Date.now();
  const endTime = startTime + duration;

  function runIteration() {
    if (iteration >= maxIterations || Date.now() >= endTime) {
      return;
    }

    let candidateSolution = [];
    let remainingProjects = [...projects];

    remainingProjects.sort(() => Math.random() - 0.5);
    const projectsToConsider = remainingProjects.slice(
      0,
      numProjectsToConsider
    );

    while (projectsToConsider.length > 0) {
      const validProjects = projectsToConsider.filter((project) => {
        return memoGetRightDevs(devs, project).length > 0;
      });

      if (validProjects.length === 0) {
        candidateSolution = [];
        break;
      }

      const chosenProject = validProjects.shift();
      const rightDevs = memoGetRightDevs(devs, chosenProject);
      const rightDevsNames = rightDevs.map((d) => d.name);
      candidateSolution.push({
        name: chosenProject.name,
        roles: rightDevsNames,
      });

      projectsToConsider.splice(
        projectsToConsider.findIndex(
          (project) => project.name === chosenProject.name
        ),
        1
      );
    }

    const localSearchSolution = optimizeSimplified([...devs], [...projects]);
    const candidateQuality = quality(candidateSolution, projects);
    const localSearchQuality = quality(localSearchSolution, projects);

    if (localSearchQuality > candidateQuality) {
      candidateSolution = localSearchSolution;
    }

    if (candidateQuality > bestQuality) {
      bestQuality = candidateQuality;
      bestSolution = candidateSolution;
    }

    iteration++;

    setTimeout(runIteration, 0);
  }

  runIteration();

  return bestSolution;
}

const index = function () {
  const fileName = process.argv[2];
  const p = process.argv[3];
  const max_iterations = process.argv[4];
  const { devs, projects } = getStructure(fileName);
  const projectsCompleted = grasp(devs, projects, p, max_iterations);
  writeResult(projectsCompleted, fileName + "txt.out.txt");
};

index();
