# [FIEK Nature Inspired Algorithms Project](https://fiek.uni-pr.edu/)

This repository contains work on the topic of Nature Inspired Algorithms, part of the FIEK (Faculty of Electrical and Computer Engineering at the University of Prishtina) curriculum.

## Contributors

- [Egzona Vllasaliu](egzona.vllasaliu@student.uni-pr.ed)

# Project Assignment Problem

The goal of this project is to optimize the assignment of contributors to projects based on their skills and project requirements.

# Problem

## Contributors

There are N contributors. Each contributor has a name and one or more skills at a specific level (0,1,2,…). Not possessing a skill is equivalent to possessing a skill at level 0.

For example, three contributors could have the following skills:

- Anna: Python level 3
- Bob: C++ level 3
- Maria: HTML level 4, CSS level 6

## Projects

There are M projects. Each project is described by:

- its name
- the duration of the project in days (how long it takes to complete a project once it is started)
- the score awarded for completing the project
- the “best before” time in days – if the project last day of work is strictly before the indicated day, it earns the full score. If it’s late (that is, the project is still worked on during or after its "best before day"), it gets one point less for each day it is late, but no less than zero points. See also the example in the "Assignments" section below.
- a list of roles for contributors working on the project

Each project has one or more roles that need to be filled by contributors. Each role requires one skill at a specific level, and can be filled by a single contributor. Each contributor can fill at most one role on a single project.

For example, a project called "WebServer" could have the following roles:

- Role 0 requiring Python level 3
- Role 1 requiring HTML level 1
- Role 2 requiring CSS level 5

## Filling roles and mentorship

A contributor can be assigned to a project for a specific role (at most one role in a single project), if they either:

1. have the skill at the required level or higher; or
2. have the skill at exactly one level below the required level, only if another contributor on the same project (assigned to another role), has this skill at the required level or higher. In this case, the contributor will be mentored by their colleague :)

One contributor can mentor multiple people at once, including for the same skill. A contributor can mentor and be mentored by other contributors at the same time.

Not possessing a skill is equivalent to possessing a skill at level 0. So a contributor can work on a project and be assigned to a role with requirement C++ level 1 if they don’t know any C++, provided that somebody else on the team knows C++ at level 1 or higher.

### For example:

For the project WebServer above we could make the following assignments:

- Role 0 (requires Python level 3) is assigned to Anna (Python level 3).

   - Anna has the same level in Python as required.

- Role 1 (requires HTML level 1) is assigned to Bob (C++ level 3).

   - Bob has level 0 in HTML. Since his level is only one below required, he can be assigned, but must be mentored by another contributor who knows HTML at level 1 or above.

- Role 2 (requires CSS level 5) is assigned to Maria (HTML level 4, CSS level 6)

   - Maria has a higher level than the one required for CSS.
   - Maria can mentor Bob on HTML since she has HTML level 4.

## Assignments

Each contributor can start working on day 0 and can be working on at most one project at the same time. Once the work on a project starts, its contributors will be working on it the number of days equal to its duration and then become available to work on other

## Solution

We use the GRASP (Greedy Randomized Adaptive Search Procedure) algorithm to generate solutions and improve them through local search.

GRASP (Greedy Randomized Adaptive Search Procedure) is a metaheuristic algorithm that is used for solving combinatorial optimization problems. The algorithm combines a greedy randomized construction of a solution with a local search procedure to improve the solution. The key idea behind GRASP is to use a randomized approach to generate a diverse set of initial solutions and then use a local search procedure to refine the solutions.

The algorithm starts by generating an initial solution using the greedy randomized construction heuristic. In this step, the algorithm randomly selects a subset of elements to form the solution, based on some criteria. The criteria can be determined by using some parameters that control the degree of randomness in the selection process.

After the initial solution is generated, the algorithm uses a local search procedure to improve the solution. The local search procedure iteratively modifies the solution by making small changes to the assignments of elements in the solution, in an attempt to find a better solution.

The GRASP algorithm then repeats the process of generating an initial solution and refining it using local search for a fixed number of iterations, and returns the best solution found during the iterations.

### Dependencies

We use the `fs` and `path` modules to work with the file system and paths.

```javascript
const fs = require("fs");
const path = require("path");
```

### Input and Output File Paths

We get the input file path from the command-line arguments and construct the output file path using the "out" folder.

```javascript
const inputFileName = process.argv[2];
if (!inputFileName) {
  console.error(
    "Please provide an input file path as a command-line argument."
  );
  process.exit(1);
}

const inputFilePath = `in/${inputFileName}`;
```

### Classes

We define several classes to represent contributors, projects, skills, and roles.

```javascript
class Contributor {
  /* ... */
}
class Project {
  /* ... */
}
class Skill {
  /* ... */
}
class Role {
  /* ... */
}
```

Parsing Input
We parse the input file to create Contributor and Project objects.

javascript
Copy code
function parseInput(filename) { /_ ... _/ }
GRASP Algorithm
We implement the GRASP algorithm to generate and improve solutions.

```javascript
function greedyRandomizedSolution(contributors, projects) {
  /* ... */
}
function localSearch(solution, contributors, projects) {
  /* ... */
}
function getSolutionScore(solution, projects) {
  /* ... */
}
function assignContributorToProject(contributor, project) {
  /* ... */
}
function grasp(contributors, projects, iterations) {
  /* ... */
}
```

The greedyRandomizedSolution function in the code implements the greedy randomized construction heuristic. It randomly selects a contributor and a project and assigns the contributor to the project if they have a suitable skill level. The function then updates the available contributors and projects lists and continues the process until all contributors or all projects have been assigned.

The localSearch function implements the local search procedure. It iterates through each assignment in the solution and attempts to reassign the contributor to a different project that they are better suited for, based on their skill level. If a better assignment is found, the solution is updated and the process is repeated until no further improvements are found.

The getSolutionScore function calculates the score of a solution based on the assigned projects and their respective scores, as well as the best before deadline of unassigned projects.

Finally, the grasp function implements the full GRASP algorithm by generating an initial solution using greedyRandomizedSolution, refining it using localSearch, and repeating the process for a fixed number of iterations. The function returns the best solution found during the iterations.

Generating Output
We create a submission file that contains the assignment of contributors to projects.

```javascript
function createSubmissionFile(solution, filename) {
  /* ... */
}
```

Putting It All Together
We parse the input file, run the GRASP algorithm, and create the output file.

```javascript
const { contributors, projects } = parseInput(inputFilePath);
const result = grasp(contributors, projects, 100);
const outputFileName =
  path.basename(inputFilePath, path.extname(inputFilePath)) + ".out.txt";
const outputFilePath = path.join("out", outputFileName);
createSubmissionFile(result, outputFilePath);
```

## Execute

```javascript
node faster.js data/<input_file> <p - %> <m - max iteration>
```

### Check if the solution is valid

```javascript
node index.js data/<input_file> 
```
