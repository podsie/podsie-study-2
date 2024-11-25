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
      learningObjectives.flatMap((lo) => {
        return [
          lo.sequence?.pretest.questionSet1,
          lo.sequence?.pretest.randomQuestionSet,
        ]
          .filter((q): q is Question => q !== undefined)
          .map((q) => ({
            ...q,
            condition: lo.condition,
          }));
      })
    ),
    type: "pretest",
    day: "pretest",
  };

  // 3. Generate learning phase assignments
  const learningAssignments: Assignment[] = [];

  // Handle wide spacing (W1D1 through W6D1)
  for (let week = 1; week <= 6; week++) {
    const questionsForDay: Question[] = [];

    // Handle high variability LOs
    const highVariabilityWideSpacingLOs = wideSpacingLOs.filter(
      (lo) => lo.condition?.variability === "high"
    );
    const lowVariabilityWideSpacingLOs = wideSpacingLOs.filter(
      (lo) => lo.condition?.variability === "low"
    );

    // Get questions from high variability LOs
    highVariabilityWideSpacingLOs.forEach((lo) => {
      const blockIndex = Math.floor((week - 1) / 2);
      const questionStartIdx = ((week - 1) % 2) * 2;

      const block = lo.sequence?.learning.blocks[blockIndex];
      if (block) {
        const questionsFromBlock = block.questions
          .slice(questionStartIdx, questionStartIdx + 2)
          .map((q) => ({
            ...q,
            condition: lo.condition,
          }));
        questionsForDay.push(...questionsFromBlock);
      }
    });

    // Get questions from low variability LOs
    lowVariabilityWideSpacingLOs.forEach((lo) => {
      const blockIndex = Math.floor((week - 1) / 2);
      const questionStartIdx = ((week - 1) % 2) * 2;

      const block = lo.sequence?.learning.blocks[blockIndex];
      if (block) {
        const questionsFromBlock = block.questions
          .slice(questionStartIdx, questionStartIdx + 2)
          .map((q) => ({
            ...q,
            condition: lo.condition,
          }));
        questionsForDay.push(...questionsFromBlock);
      }
    });

    const wideSpacingAssignment: Assignment = {
      questions: shuffleArray([...questionsForDay]),
      type: "learning",
      day: `W${week}D1`,
    };
    learningAssignments.push(wideSpacingAssignment);
  }

  // Handle narrow spacing (W1D2 through W6D2)
  const highVariabilityNarrowSpacingLOs = narrowSpacingLOs.filter(
    (lo) => lo.condition?.variability === "high"
  );
  const lowVariabilityNarrowSpacingLOs = narrowSpacingLOs.filter(
    (lo) => lo.condition?.variability === "low"
  );

  for (let week = 1; week <= 6; week++) {
    const highVariabilityLO =
      highVariabilityNarrowSpacingLOs[Math.floor((week - 1) / 2)];
    const lowVariabilityLO =
      lowVariabilityNarrowSpacingLOs[Math.floor((week - 1) / 2)];

    const questionsForDay = [highVariabilityLO, lowVariabilityLO].flatMap(
      (lo) =>
        lo.sequence?.learning.blocks.flatMap((block) =>
          block.questions.map((q) => ({
            ...q,
            condition: lo.condition,
          }))
        ) ?? []
    );

    const narrowSpacingAssignment: Assignment = {
      questions: shuffleArray([...questionsForDay]),
      type: "learning",
      day: `W${week}D2`,
    };
    learningAssignments.push(narrowSpacingAssignment);
  }

  // 4. Generate posttest
  const posttest: Assignment = {
    questions: shuffleArray(
      learningObjectives.flatMap((lo) => {
        return [
          lo.sequence?.posttest.questionSet6,
          lo.sequence?.posttest.matchingPretest,
        ]
          .filter((q): q is Question => q !== undefined)
          .map((q) => ({
            ...q,
            condition: lo.condition,
          }));
      })
    ),
    type: "posttest",
    day: "posttest",
  };

  // 5. Return all assignments
  return [pretest, ...learningAssignments, posttest];
};
