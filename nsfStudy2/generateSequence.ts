import random from "random";
import {
  LearningObjective,
  Question,
  QuestionBlock,
  QuestionSet,
  SpacingCondition,
  VariabilityCondition,
} from "./nsfStudy2.types";
import { parseQuestions } from "./parseQuestions";
import { shuffleArray } from "./util";

const selectRandomQuestionFromSet = (set: QuestionSet): Question => {
  if (!set) {
    throw new Error(`No set!`);
  }
  return shuffleArray([...set.questions])[0];
};

export const generateSequences = () => {
  // Parse questions and log some samples
  const learningObjectives = parseQuestions();

  // shuffle the learningObjectives:
  const shuffledLearningObjectives = shuffleArray(learningObjectives);

  // Assign conditions to the shuffled LOs
  const conditions: Array<{
    spacing: SpacingCondition;
    variability: VariabilityCondition;
  }> = [
    { spacing: "wide", variability: "high" },
    { spacing: "narrow", variability: "high" },
    { spacing: "wide", variability: "low" },
    { spacing: "narrow", variability: "low" },
  ];

  // Since we have 24 LOs total (4 groups of 6), assign conditions to each group
  const assignedLearningObjectives = shuffledLearningObjectives.map(
    (lo, index) => ({
      ...lo,
      condition: conditions[Math.floor(index / 6)],
    })
  );

  const finalLearningObjectives: LearningObjective[] =
    assignedLearningObjectives.map((lo) => {
      const shuffledSets = shuffleArray(lo.sets);

      // 1. Select random pretest question from Q1-Q4
      const pretestSetIndex = random.int(0, 3); // Random number between 0-3 for Q1-Q4
      const pretest = {
        selectedQuestion: {
          ...selectRandomQuestionFromSet(shuffledSets[pretestSetIndex]),
          condition: lo.condition,
        },
        selectedSetIndex: pretestSetIndex,
      };

      // 2. Handle Learning Phase
      const blocks: QuestionBlock[] = [];

      if (lo.condition?.variability === "high") {
        // Create 3 blocks with all Q1-Q4 questions
        while (blocks.length < 3) {
          const blockQuestions = shuffledSets
            .slice(0, 4) // Use Q1-Q4
            .map((set) => ({
              ...selectRandomQuestionFromSet(set),
              condition: lo.condition,
            }));
          blocks.push({
            questions: shuffleArray(blockQuestions),
            blockNumber: blocks.length + 1,
          });
        }
      } else {
        // Create 3 blocks using only the pretest question (Qx)
        while (blocks.length < 3) {
          const questions: Question[] = [];
          while (questions.length < 4) {
            questions.push({
              ...selectRandomQuestionFromSet(shuffledSets[pretestSetIndex]),
              condition: lo.condition,
            });
          }
          blocks.push({
            questions: shuffleArray(questions),
            blockNumber: blocks.length + 1,
          });
        }
      }

      // 3. Handle Posttest - Q5 and pretest question (Qx)
      const posttest = {
        questionSet5: {
          ...selectRandomQuestionFromSet(shuffledSets[4]), // Q5
          condition: lo.condition,
        },
        matchingPretest: {
          ...selectRandomQuestionFromSet(shuffledSets[pretestSetIndex]), // Qx
          condition: lo.condition,
        },
      };

      // 4. Handle Delayed Posttest - Q6 and pretest question (Qx)
      const postposttest = {
        questionSet6: {
          ...selectRandomQuestionFromSet(shuffledSets[5]), // Q6
          condition: lo.condition,
        },
        matchingPretest: {
          ...selectRandomQuestionFromSet(shuffledSets[pretestSetIndex]), // Qx
          condition: lo.condition,
        },
      };

      return {
        ...lo,
        sequence: {
          pretest,
          learning: { blocks },
          posttest,
          postposttest,
        },
      };
    });

  // Remove no longer needed sets
  const finalLearningObjectivesWithoutSets = finalLearningObjectives.map(
    (lo) => ({
      ...lo,
      sets: undefined,
    })
  );
  return finalLearningObjectivesWithoutSets as Omit<
    LearningObjective,
    "sets"
  >[];
};
