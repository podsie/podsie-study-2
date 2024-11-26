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

  // iterate through each LO:
  const finalLearningObjectives: LearningObjective[] =
    assignedLearningObjectives.map((lo) => {
      const shuffledSets = shuffleArray(lo.sets);

      // 1. Handle Pretest
      const selectedPretestSetNumber = random.int(2, 5); // Random number between 2-5
      const pretest = {
        questionSet1: {
          ...selectRandomQuestionFromSet(shuffledSets[0]),
          conditions: lo.condition,
        },
        selectedPretestSetNumber,
        randomQuestionSet: selectRandomQuestionFromSet(
          shuffledSets[selectedPretestSetNumber - 1]
        ),
      };

      // 2. Handle Learning Phase
      const blocks: QuestionBlock[] = [];

      if (lo.condition?.variability === "high") {
        // create 3 blocks:
        while (blocks.length < 3) {
          const blockQuestions = shuffledSets
            .slice(1, 5)
            .map((set) => selectRandomQuestionFromSet(set));
          blocks.push({
            questions: shuffleArray(blockQuestions),
            blockNumber: blocks.length + 1,
          });
        }
      } else {
        // also create 3 blocks, but the questions are from the set selected for the pretest:
        while (blocks.length < 3) {
          const selectedSet = shuffledSets[selectedPretestSetNumber - 1];
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
          shuffledSets[pretest.selectedPretestSetNumber - 1]
        ),
      };

      const postposttest = {
        questionSet7: selectRandomQuestionFromSet(shuffledSets[6]), // Random question from Set 7
        matchingPretest: selectRandomQuestionFromSet(
          shuffledSets[pretest.selectedPretestSetNumber - 1]
        ),
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

  // remove no longer neded sets:
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
