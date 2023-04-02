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
  constructor(skill, level) {
    this.skill = skill;
    this.level = level;
  }
}

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

function greedyRandomizedSolution(contributors, projects) {
  // Initialize an empty solution object with assignments and score properties
  let solution = {
    assignments: [],
    score: 0,
  };

  // Make a copy of the input arrays to keep track of available contributors and projects
  let availableContributors = [...contributors];
  let availableProjects = [...projects];

  // Continue while there are still available contributors and projects
  while (availableContributors.length > 0 && availableProjects.length > 0) {
    // Randomly select a contributor from the available contributors array
    const contributorIndex = Math.floor(
      Math.random() * availableContributors.length
    );
    const contributor = availableContributors[contributorIndex];

    // Randomly select a project from the available projects array
    const projectIndex = Math.floor(Math.random() * availableProjects.length);
    const project = availableProjects[projectIndex];

    // Attempt to assign the contributor to the project based on their skill level
    const assigned = assignContributorToProject(contributor, project);

    // If the assignment is successful, update the solution and available arrays
    if (assigned) {
      // Add the contributor and project to the assignments array of the solution object
      solution.assignments.push({ contributor, project });

      // Remove the selected contributor from the available contributors array
      availableContributors.splice(contributorIndex, 1);

      // If the project no longer has available roles, remove it from the available projects array
      if (project.roles.length === 0) {
        availableProjects.splice(projectIndex, 1);
      }
    }
    // If the assignment is not successful, remove the selected contributor from the available contributors array
    else {
      availableContributors.splice(contributorIndex, 1);
    }
  }

  // Calculate the score of the solution and store it in the solution object
  solution.score = getSolutionScore(solution, projects);

  console.log(solution.score);

  // Return the solution object
  return solution;
}

function localSearch(solution, contributors, projects) {
  // Initialize a flag to keep track of whether the solution has been changed
  let changed;

  // Continue until no further improvements can be made
  do {
    // Reset the flag at the beginning of each iteration
    changed = false;

    // Iterate through each assignment in the solution
    for (let i = 0; i < solution.assignments.length; i++) {
      // Get the current assignment and project
      const currentAssignment = solution.assignments[i];

      // Iterate through each contributor to find a better assignment for the current project
      for (const contributor of contributors) {
        // Attempt to assign the current contributor to the current project
        if (
          assignContributorToProject(contributor, currentAssignment.project)
        ) {
          // If a better assignment is found, update the solution and set the flag to indicate that the solution has been changed
          solution.assignments[i] = {
            contributor,
            project: currentAssignment.project,
          };
          solution.score = getSolutionScore(solution, projects);
          changed = true;
          break;
        }
      }
    }
  } while (changed); // Repeat the process until no further improvements can be made

  // Return the solution object
  return solution;
}

function getSolutionScore(solution, projects) {
  // Initialize a variable to store the score
  let score = 0;

  // Create a Set of assigned project names using the assignments array of the solution object
  const assignedProjects = new Set(
    solution.assignments.map((a) => a.project.name)
  );

  // Iterate through each project and add its score to the total score if it has been assigned,
  // or subtract its bestBefore value from the total score if it has not been assigned
  for (const project of projects) {
    if (assignedProjects.has(project.name)) {
      // The project has been assigned, so add its score to the total score
      score += project.score;
    } else {
      // The project has not been assigned, so subtract its bestBefore value from the total score
      score -= project.bestBefore;
    }
  }
  // Return the total score
  return score;
}

function assignContributorToProject(contributor, project) {
  // Iterate through each role in the project's roles array
  for (const role of project.roles) {
    // Check whether the contributor has the required skill level for the role
    const skillLevel = contributor.skills[role.skill];
    if (skillLevel && skillLevel + 1 >= role.level) {
      // The contributor has the required skill level, so remove the role from the project's roles array
      const roleIndex = project.roles.findIndex((r) => r.skill === role.skill);
      project.roles.splice(roleIndex, 1);

      // If the project has not been assigned any roles yet, create an array to store the assigned roles
      if (!project.assignedRoles) {
        project.assignedRoles = [];
      }

      // Add the assigned role to the project's assignedRoles array
      project.assignedRoles.push(role);

      // Return true to indicate that the assignment was successful
      return true;
    }
  }

  // If no suitable role was found, return false to indicate that the assignment was unsuccessful
  return false;
}

function grasp(contributors, projects, iterations) {
  // Initialize a bestSolution object with an empty assignments array and a score of -Infinity
  let bestSolution = {
    assignments: [],
    score: -Infinity,
  };

  // Run the GRASP algorithm for the specified number of iterations
  for (let i = 0; i < iterations; i++) {
    // Generate an initial solution using the greedyRandomizedSolution function
    let solution = greedyRandomizedSolution(contributors, projects);

    // Refine the solution using the localSearch function
    solution = localSearch(solution, contributors, projects);

    // Update the bestSolution object if the score of the new solution is better than the current best score
    if (solution.score > bestSolution.score) {
      bestSolution = solution;
    }
  }

  // Return the best solution found during the iterations
  return bestSolution;
}

const { contributors, projects } = parseInput(inputFilePath);

function createSubmissionFile(solution, filename) {
  let output = [];

  // Group assignments by project
  const assignmentsByProject = {};
  for (const assignment of solution.assignments) {
    const projectName = assignment.project.name;
    if (!assignmentsByProject[projectName]) {
      assignmentsByProject[projectName] = [];
    }
    assignmentsByProject[projectName].push(assignment.contributor.name);
  }

  // Add the number of unique projects that are planned
  output.push(Object.keys(assignmentsByProject).length);

  // Format assignments for each project
  for (const projectName in assignmentsByProject) {
    output.push(projectName);
    output.push(assignmentsByProject[projectName].join(" "));
  }

  // Write the output to the specified file
  fs.writeFileSync(filename, output.join("\n"), "utf8");
}

// Example usage:
const outputFileName =
  path.basename(inputFilePath, path.extname(inputFilePath)) + ".out.txt";
const outputFilePath = path.join("out", outputFileName);

const result = grasp(contributors, projects, 100);

createSubmissionFile(result, outputFilePath);
