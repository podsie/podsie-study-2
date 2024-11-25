# NSF Study 2 - Question Sequence Generator

## Overview

The generator creates sequences with the following characteristics:

- Randomly selects and organizes 24 learning standards (also referred to as learning objectives/LOs) into 4 groups of 6
- Each group is assigned one of four conditions combining spacing (wide/narrow) and variability (high/low)
- For each standard, questions are organized into:
  - Pretest (2 questions)
  - Learning phase (3 blocks of 4 questions each)
  - Posttest (2 questions)

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation

```bash
npm install
```

### Scripts

- Generate sequences and assignments:

```bash
npm run generate
```

- Run tests:

```bash
npm test
```

## Code Structure

- `nsfStudy2/generateSequence.ts` - Generates the initial question sequences for each learning objective
- `nsfStudy2/generateStudentAssignment.ts` - Creates daily student assignments based on spacing conditions
- `nsfStudy2/parseQuestions.ts` - Handles question data parsing
- `nsfStudy2/nsfStudy2.types.ts` - TypeScript type definitions

## Output

The generator produces two JSON files in the `data` directory:

1. Generated sequences for each learning objective
2. Daily student assignments organized by:
   - Pretest
   - Learning phase (W1D1 through W6D2)
   - Posttest

Each assignment contains shuffled questions appropriate for the student's assigned conditions. You can run the `generate` script to generate new sequences and assignments for a new example student. Files with the same timestamp represent file for the same student.
