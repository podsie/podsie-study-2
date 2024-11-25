import { Assignment, LearningObjective, Question } from "./nsfStudy2.types";
import { shuffleArray } from "./util";

export const generateStudentAssignment = (
  learningObjectives: Omit<LearningObjective, "sets">[]
): Assignment[] => {
  // 1. Split LOs by spacing condition
  const wideSpacingLOs = learningObjectives.filter(
    (lo) => lo.condition?.spacing === "wide"
  );
  const narrowSpacingLOs = learningObjectives.filter(
    (lo) => lo.condition?.spacing === "narrow"
  );

  // 2. Generate pretest
  const pretest: Assignment = {
    questions: shuffleArray(
      learningObjectives
        .flatMap((lo) => [
          lo.sequence?.pretest.questionSet1,
          lo.sequence?.pretest.randomQuestionSet,
        ])
        .filter((q): q is Question => q !== undefined)
    ),
    type: "pretest",
    day: "pretest",
  };

  // 3. Generate learning phase assignments
  const learningAssignments: Assignment[] = [];

  // Handle wide spacing (W1D1 through W6D1)
  // For wide spacing, we want 2 questions per LO, showing all LOs each day
  for (let week = 1; week <= 6; week++) {
    const questionsForDay: Question[] = [];

    wideSpacingLOs.forEach((lo) => {
      // Calculate which questions to show from which block
      const blockIndex = Math.floor((week - 1) / 2); // Use same block for 2 weeks
      const questionStartIdx = ((week - 1) % 2) * 2; // Alternate between first/last 2 questions

      const block = lo.sequence?.learning.blocks[blockIndex];
      if (block) {
        // Take 2 questions from the block
        const questionsFromBlock = block.questions.slice(
          questionStartIdx,
          questionStartIdx + 2
        );
        questionsForDay.push(...questionsFromBlock);
      }
    });

    const wideSpacingAssignment: Assignment = {
      questions: [...questionsForDay],
      //   shuffleArray(questionsForDay),
      type: "learning",
      day: `W${week}D1`,
    };
    learningAssignments.push(wideSpacingAssignment);
  }

  // Handle narrow spacing (W1D2 through W6D2)
  // For narrow spacing, show 2 LOs per day, all questions for those LOs
  for (let week = 1; week <= 6; week++) {
    // Select 2 LOs for this day
    const startIdx = (week - 1) * 2;
    const narrowLOsForDay = narrowSpacingLOs.slice(startIdx, startIdx + 2);

    const questionsForDay = narrowLOsForDay.flatMap(
      (lo) =>
        // For each LO, get all questions from all blocks
        lo.sequence?.learning.blocks.flatMap((block) => block.questions) ?? []
    );

    const narrowSpacingAssignment: Assignment = {
      questions: [...questionsForDay],
      //   shuffleArray(questionsForDay),
      type: "learning",
      day: `W${week}D2`,
    };
    learningAssignments.push(narrowSpacingAssignment);
  }

  // 4. Generate posttest
  const posttest: Assignment = {
    questions: shuffleArray(
      learningObjectives
        .flatMap((lo) => [
          lo.sequence?.posttest.questionSet6,
          lo.sequence?.posttest.matchingPretest,
        ])
        .filter((q): q is Question => q !== undefined)
    ),
    type: "posttest",
    day: "posttest",
  };

  // 5. Return all assignments
  return [pretest, ...learningAssignments, posttest];
};
