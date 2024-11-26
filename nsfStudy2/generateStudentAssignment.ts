import { Assignment, LearningObjective, Question } from "./nsfStudy2.types";
import { shuffleArray } from "./util";

export const generateStudentAssignment = (
  learningObjectives: Omit<LearningObjective, "sets">[]
): Assignment[] => {
  // 1. Randomly decide if D1 will be wide spacing or narrow spacing
  const isD1Wide = Math.random() < 0.5;

  // Split LOs by spacing condition, but swap them if D1 should be narrow
  const [d1SpacingLOs, d2SpacingLOs] = isD1Wide
    ? [
        learningObjectives.filter((lo) => lo.condition?.spacing === "wide"),
        learningObjectives.filter((lo) => lo.condition?.spacing === "narrow"),
      ]
    : [
        learningObjectives.filter((lo) => lo.condition?.spacing === "narrow"),
        learningObjectives.filter((lo) => lo.condition?.spacing === "wide"),
      ];

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

  // Handle D1 assignments (W1D1 through W6D1)
  for (let week = 1; week <= 6; week++) {
    const questionsForDay: Question[] = [];

    // Split D1 LOs by variability
    const highVariabilityD1LOs = d1SpacingLOs.filter(
      (lo) => lo.condition?.variability === "high"
    );
    const lowVariabilityD1LOs = d1SpacingLOs.filter(
      (lo) => lo.condition?.variability === "low"
    );

    // Get questions from high variability LOs
    highVariabilityD1LOs.forEach((lo) => {
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
    lowVariabilityD1LOs.forEach((lo) => {
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

    const d1Assignment: Assignment = {
      questions: shuffleArray([...questionsForDay]),
      type: "learning",
      day: `W${week}D1`,
    };
    learningAssignments.push(d1Assignment);
  }

  // Handle D2 assignments (W1D2 through W6D2)
  for (let week = 1; week <= 6; week++) {
    // Split D2 LOs by variability
    const highVariabilityD2LOs = d2SpacingLOs.filter(
      (lo) => lo.condition?.variability === "high"
    );
    const lowVariabilityD2LOs = d2SpacingLOs.filter(
      (lo) => lo.condition?.variability === "low"
    );

    // Get all questions for the current week's D2 LOs
    const highVariabilityLO = highVariabilityD2LOs[Math.floor((week - 1) / 2)];
    const lowVariabilityLO = lowVariabilityD2LOs[Math.floor((week - 1) / 2)];

    const questionsForDay = [highVariabilityLO, lowVariabilityLO].flatMap(
      (lo) =>
        lo?.sequence?.learning.blocks.flatMap((block) =>
          block.questions.map((q) => ({
            ...q,
            condition: lo.condition,
          }))
        ) ?? []
    );

    const d2Assignment: Assignment = {
      questions: shuffleArray([...questionsForDay]),
      type: "learning",
      day: `W${week}D2`,
    };
    learningAssignments.push(d2Assignment);
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

  const postposttest: Assignment = {
    questions: shuffleArray(
      learningObjectives.flatMap((lo) => {
        return [
          lo.sequence?.postposttest.questionSet7,
          lo.sequence?.postposttest.matchingPretest,
        ]
          .filter((q): q is Question => q !== undefined)
          .map((q) => ({
            ...q,
            condition: lo.condition,
          }));
      })
    ),
    type: "postposttest",
    day: "postposttest",
  };

  // 5. Return all assignments
  const sortedLearningAssignments = learningAssignments.sort((a, b) => {
    const weekA = parseInt(a.day.match(/W(\d+)/)?.[1] ?? "0");
    const weekB = parseInt(b.day.match(/W(\d+)/)?.[1] ?? "0");

    if (weekA === weekB) {
      // If same week, sort by day (D1 before D2)
      return a.day.includes("D1") ? -1 : 1;
    }

    return weekA - weekB;
  });

  return [pretest, ...sortedLearningAssignments, posttest, postposttest];
};
