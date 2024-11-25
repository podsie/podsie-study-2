import { readFileSync, writeFileSync } from "fs";
import { shuffleArray } from "~/utils/arrays/shuffleArray.utils";
import { generateStudentAssignment } from "./generateStudentAssignment";
import {
  LearningObjective,
  Question,
  QuestionBlock,
  QuestionSet,
  SpacingCondition,
  VariabilityCondition,
} from "./nsfStudy2.types";

const parseQuestions = (): LearningObjective[] => {
  // Read the JSONL file
  const fileContent = readFileSync("placeholder-questions.jsonl", "utf-8");
  const questions: Question[] = fileContent
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));

  // Group questions by LO
  const loMap = new Map<number, Question[]>();
  questions.forEach((question) => {
    const loMatch = question.lo.match(/\d+/);
    if (!loMatch) {
      throw new Error(`Invalid LO format for question: ${question.id}`);
    }
    const loNumber = parseInt(loMatch[0]);
    if (!loMap.has(loNumber)) {
      loMap.set(loNumber, []);
    }
    const questions = loMap.get(loNumber);
    if (!questions) {
      throw new Error(`Failed to get questions array for LO ${loNumber}`);
    }
    questions.push(question);
  });

  // Convert map to array of LearningObjectives
  const learningObjectives: LearningObjective[] = [];
  loMap.forEach((questions, loNumber) => {
    // Group questions by set
    const setMap = new Map<number, Question[]>();
    questions.forEach((question) => {
      const setNumber = parseInt(question.id.split("-")[3].substring(1));
      if (!setMap.has(setNumber)) {
        setMap.set(setNumber, []);
      }
      const questions = setMap.get(setNumber);
      if (!questions) {
        throw new Error(`Failed to get questions array for set ${setNumber}`);
      }
      questions.push(question);
    });

    // Convert sets map to array of QuestionSets
    const sets: QuestionSet[] = [];
    setMap.forEach((questions) => {
      // Sort questions by type to maintain consistent order
      const sortedQuestions = questions.sort((a, b) => {
        const typeOrder = {
          "Multiple Choice": 0,
          "True or False": 1,
          "Fill in Blank": 2,
          "Short Answer": 3,
        } as const;
        return typeOrder[a.type as keyof typeof typeOrder] -
          typeOrder[b.type as keyof typeof typeOrder];
      });

      sets.push({ questions: sortedQuestions });
    });

    learningObjectives.push({
      loNumber,
      sets: sets.sort((a, b) => {
        const setNumberA = parseInt(
          a.questions[0].id.split("-")[3].substring(1),
        );
        const setNumberB = parseInt(
          b.questions[0].id.split("-")[3].substring(1),
        );
        return setNumberA - setNumberB;
      }),
    });
  });

  return learningObjectives.sort((a, b) => a.loNumber - b.loNumber);
};

// Parse questions and log some samples
const learningObjectives = parseQuestions();

// Log some sample data
console.log("\nParsed Data Verification:");
console.log("======================");
console.log(`Total Learning Objectives: ${learningObjectives.length}`);
console.log(`Sets per LO: ${learningObjectives[0].sets.length}`);
console.log(
  `Question types per set: ${
    Object.keys(learningObjectives[0].sets[0]).length
  }`,
);

// Log a sample LO with its first set
console.log("\nSample Learning Objective (LO1, Set1):");
console.log(JSON.stringify(learningObjectives[0], null, 2));

// shuffle the learningObjectives:
const shuffledLearningObjectives = shuffleArray(learningObjectives);

// Assign conditions to the shuffled LOs
const conditions: Array<
  { spacing: SpacingCondition; variability: VariabilityCondition }
> = [
  { spacing: "wide", variability: "high" },
  { spacing: "narrow", variability: "high" },
  { spacing: "wide", variability: "low" },
  { spacing: "narrow", variability: "low" },
];

// Since we have 24 LOs total (4 groups of 6), assign conditions to each group
const assignedLearningObjectives = shuffledLearningObjectives.map((
  lo,
  index,
) => ({
  ...lo,
  condition: conditions[Math.floor(index / 6)],
}));

// Verify the distribution
console.log("\nCondition Distribution:");
conditions.forEach((condition) => {
  const count = assignedLearningObjectives.filter(
    (lo) =>
      lo.condition?.spacing === condition.spacing &&
      lo.condition?.variability === condition.variability,
  ).length;
  console.log(
    `${condition.spacing} spacing, ${condition.variability} variability: ${count} LOs`,
  );
});

const selectRandomQuestionFromSet = (set: QuestionSet): Question =>
  shuffleArray([...set.questions])[0];

// iterate through each LO:
const finalLearningObjectives: LearningObjective[] = assignedLearningObjectives
  .map((lo) => {
    // Get question sets in order (1-6)
    const shuffledSets = shuffleArray(lo.sets);

    // 1. Handle Pretest
    const selectedPretestSetNumber = Math.floor(Math.random() * 4) + 2; // Random number between 2-5
    const pretest = {
      questionSet1: selectRandomQuestionFromSet(shuffledSets[0]), // First question from Set 1
      selectedPretestSetNumber,
      randomQuestionSet: selectRandomQuestionFromSet(
        shuffledSets[selectedPretestSetNumber - 1],
      ),
    };

    // 2. Handle Learning Phase
    const blocks: QuestionBlock[] = [];

    if (lo.condition?.variability === "high") {
      // create 3 blocks:
      while (blocks.length < 3) {
        const blockQuestions = shuffledSets.slice(1, 5).map((set) =>
          selectRandomQuestionFromSet(set)
        );
        blocks.push({
          questions: shuffleArray(blockQuestions),
          blockNumber: blocks.length + 1,
        });
      }
    } else {
      // also create 3 blocks, but we select 1 random set from QuestionSet 2-5:
      const selectedLearningSetNumber = Math.floor(Math.random() * 4) + 2; // Random number between 2-5
      while (blocks.length < 3) {
        const selectedSet = shuffledSets[selectedLearningSetNumber - 1];
        const questions: Question[] = [];
        while (questions.length < 4) {
          questions.push(selectRandomQuestionFromSet(selectedSet));
        }
        blocks.push({
          questions,
          blockNumber: blocks.length + 1,
        });
      }
    }

    // 3. Handle Posttest
    const posttest = {
      questionSet6: selectRandomQuestionFromSet(shuffledSets[5]), // Random question from Set 6
      matchingPretest: selectRandomQuestionFromSet(
        shuffledSets[pretest.selectedPretestSetNumber - 1],
      ),
    };

    return {
      ...lo,
      sequence: {
        pretest,
        learning: { blocks },
        posttest,
      },
    };
  });

// remove no longer neded sets:
const finalLearningObjectivesWithoutSets = finalLearningObjectives.map(
  (lo) => ({
    ...lo,
    sets: undefined,
  }),
);

writeFileSync(
  `./${new Date().toISOString()}-generatedSequence.json`,
  JSON.stringify(finalLearningObjectivesWithoutSets, null, 2),
  "utf-8",
);

const studentAssignments = generateStudentAssignment(
  finalLearningObjectivesWithoutSets,
);

writeFileSync(
  `./${new Date().toISOString()}-generatedStudentAssignments.json`,
  JSON.stringify(studentAssignments, null, 2),
  "utf-8",
);

export { finalLearningObjectivesWithoutSets, studentAssignments };
