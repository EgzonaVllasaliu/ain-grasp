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

const inputFilePath = `in/${inputFileName}`;

function parseInput(filename) {
  const input = fs.readFileSync(filename, "utf8");
  const lines = input.trim().split("\n");
  const [C, P] = lines.shift().split(" ").map(Number);

  const contributors = [];
  const projects = [];

  for (let i = 0; i < C; i++) {
    const [name, N] = lines.shift().split(" ");
    const skills = [];
    for (let j = 0; j < Number(N); j++) {
      const [skillName, level] = lines.shift().split(" ");
      skills.push(new Skill(skillName, Number(level)));
    }
    contributors.push(new Contributor(name, skills));
  }

  for (let i = 0; i < P; i++) {
    const [name, D, S, B, R] = lines
      .shift()
      .split(" ")
      .map((x, i) => (i === 0 ? x : Number(x)));
    const roles = [];
    for (let j = 0; j < R; j++) {
      const [skillName, requiredLevel] = lines.shift().split(" ");
      roles.push(new Role(skillName, Number(requiredLevel)));
    }
    projects.push(new Project(name, D, S, B, roles));
  }

  return { contributors, projects };
}

class Contributor {
  constructor(name, skills) {
    this.name = name;
    this.skills = {};
    for (const { name, level } of skills) {
      this.skills[name] = level;
    }
  }
}

class Project {
  constructor(name, duration, score, bestBefore, roles) {
    this.name = name;
    this.duration = duration;
    this.score = score;
    this.bestBefore = bestBefore;
    this.roles = roles;
  }
}

class Skill {
  constructor(name, level) {
    this.name = name;
    this.level = level;
  }
}

class Role {
  constructor(skill, requiredLevel) {
    this.skill = skill;
    this.requiredLevel = requiredLevel;
  }
}

function findMentor(
  availableContributors,
  assignedContributors,
  skill,
  requiredLevel
) {
  return availableContributors.find((contributor) => {
    return (
      (contributor.skills[skill] || 0) >= requiredLevel &&
      !assignedContributors.includes(contributor)
    );
  });
}

function findAssignableContributors(availableContributors, role) {
  const assignableContributors = [];

  for (const contributor of availableContributors) {
    if ((contributor.skills[role.skill] || 0) >= role.requiredLevel) {
      assignableContributors.push({ contributor, mentee: null });
    } else if (
      (contributor.skills[role.skill] || 0) ===
      role.requiredLevel - 1
    ) {
      const mentor = findMentor(
        availableContributors,
        role.skill,
        role.requiredLevel
      );
      if (mentor) {
        assignableContributors.push({ contributor, mentee: mentor });
      }
    }
  }

  return assignableContributors;
}

function randomFeasibleSolution(contributors, projects) {
  const availableContributors = [...contributors];
  availableContributors.sort(() => Math.random() - 0.5);

  const solution = [];

  for (const project of projects) {
    const assignedContributors = [];

    for (const role of project.roles) {
      const assignableContributors = findAssignableContributors(
        availableContributors,
        role
      );

      if (assignableContributors.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(
        Math.random() * assignableContributors.length
      );
      const { contributor, mentee } = assignableContributors[randomIndex];
      assignedContributors.push(contributor);

      if (mentee) {
        assignedContributors.push(mentee);
      }

      availableContributors.splice(
        availableContributors.indexOf(contributor),
        1
      );

      if (mentee) {
        availableContributors.splice(availableContributors.indexOf(mentee), 1);
      }
    }

    solution.push({ project, assignedContributors });
  }

  return solution;
}

function tweak(solution) {
  if (solution === null || solution.length === 0) {
    return null;
  }

  const tweakedSolution = JSON.parse(JSON.stringify(solution));
  const swapIndex1 = Math.floor(Math.random() * tweakedSolution.length);
  const swapIndex2 = Math.floor(Math.random() * tweakedSolution.length);

  const temp = tweakedSolution[swapIndex1];
  tweakedSolution[swapIndex1] = tweakedSolution[swapIndex2];
  tweakedSolution[swapIndex2] = temp;

  return tweakedSolution;
}

function quality(solution) {
  let totalScore = 0;

  for (const { project, assignedContributors } of solution) {
    let projectScore = project.score;

    // Apply penalty for delays
    let totalDelay = 0;
    for (const contributor of assignedContributors) {
      totalDelay += Math.max(
        0,
        contributor.skills[project.name] - project.bestBefore
      );
    }
    projectScore -= totalDelay;

    totalScore += projectScore;

    // Update skill levels for learning
    for (const contributor of assignedContributors) {
      for (const role of project.roles) {
        if (
          contributor.skills[role.skill] &&
          contributor.skills[role.skill] >= role.requiredLevel
        ) {
          contributor.skills[role.skill] += 1;
        }
      }
    }
  }

  return totalScore;
}

// There are some improvements I still need to do
function grasp(input_data, p, m, maxIterations) {
  const { contributors, projects } = input_data;
  let bestSolution = null;
  let bestQuality = -Infinity;

  for (let i = 0; i < maxIterations; i++) {
    let solution = randomFeasibleSolution(contributors, projects);
    if (solution === null) {
      continue;
    }
    for (let j = 0; j < m; j++) {
      const tweakedSolution = tweak(solution);
      if (
        tweakedSolution !== null &&
        quality(tweakedSolution) > quality(solution)
      ) {
        solution = tweakedSolution;
      }
    }
    if (quality(solution) > bestQuality) {
      bestSolution = solution;
      bestQuality = quality(solution);
    }
  }

  return bestSolution;
}

parseInput(inputFilePath);

const p = 0.5;
const m = 10;
const maxIterations = 100;
const bestSolution = grasp(parseInput(inputFilePath), p, m, maxIterations);
console.log(bestSolution);
