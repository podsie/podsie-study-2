import { Assignment, LearningObjective, Question } from "./nsfStudy2.types";
import { shuffleArray } from "./util";

export const generateStudentAssignment = (
  learningObjectives: Omit<LearningObjective, "sets">[],
  isD1WidePreset?: boolean
): Assignment[] => {
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

  const wideAssignmentQuestionSets: Assignment["questions"][] = [];
  const narrowAssignmentQuestionSets: Assignment["questions"][] = [];
  const wideSpacingLOs = learningObjectives.filter(
    (lo) => lo.condition?.spacing === "wide"
  );
  const narrowSpacingHighVariabilityLOs = learningObjectives.filter(
    (lo) =>
      lo.condition?.spacing === "narrow" && lo.condition?.variability === "high"
  );
  const narrowSpacingLowVariabilityLOs = learningObjectives.filter(
    (lo) =>
      lo.condition?.spacing === "narrow" && lo.condition?.variability === "low"
  );

  const blockIndices = [
    0, // day 1 takes from block 1 first half, so index 0 and then 0..1
    0, // day 2 takes from block 1 second half, so index 0 and then 2..3
    1, // day 3 takes from block 2 first half, so index 1 and then 0..1
    1, // day 4 takes from block 2 second half, so index 1 and then 2..3
    2, // day 5 takes from block 3 first half, so index 2 and then 0..1
    2, // day 6 takes from block 3 second half, so index 2 and then 2..3
  ];

  const questionIndices = [
    [0, 1], // day 1 takes from block 1 first half, so index 0 and then 0..1
    [2, 3], // day 2 takes from block 1 second half, so index 0 and then 2..3
    [0, 1], // day 3 takes from block 2 first half, so index 1 and then 0..1
    [2, 3], // day 4 takes from block 2 second half, so index 1 and then 2..3
    [0, 1], // day 5 takes from block 3 first half, so index 2 and then 0..1
    [2, 3], // day 6 takes from block 3 second half, so index 2 and then 2..3
  ];

  for (let day = 1; day <= 6; day++) {
    const currentDayWideQuestionSet: Assignment["questions"] = [];
    // handle wide spacing LOs
    const blockIndex = blockIndices[day - 1];
    const [questionIndexStart, questionIndexEnd] = questionIndices[day - 1];
    wideSpacingLOs.forEach((lo) => {
      const block = lo.sequence?.learning.blocks[blockIndex];
      if (block) {
        const questions = block.questions
          .slice(questionIndexStart, questionIndexEnd + 1) // +1 because slice is end-exclusive
          .map((q) => ({ ...q, condition: lo.condition }));
        currentDayWideQuestionSet.push(...questions);
      }
    });
    wideAssignmentQuestionSets.push(currentDayWideQuestionSet);

    const currentDayNarrowQuestionSet: Assignment["questions"] = [];
    // handle narrow spacing LOs
    // take 1 high and 1 low variability LO for each day
    const highVariabilityLO = narrowSpacingHighVariabilityLOs[day - 1];
    const lowVariabilityLO = narrowSpacingLowVariabilityLOs[day - 1];
    if (highVariabilityLO && lowVariabilityLO) {
      const questions = [highVariabilityLO, lowVariabilityLO].flatMap((lo) =>
        (lo.sequence?.learning.blocks ?? []).flatMap((block) =>
          block.questions.map((q) => ({ ...q, condition: lo.condition }))
        )
      );
      currentDayNarrowQuestionSet.push(...questions);
    }
    narrowAssignmentQuestionSets.push(currentDayNarrowQuestionSet);
  }

  // use question sets to put together assignments:
  const learningAssignments: Assignment[] = [];

  // counter-balancing logic:
  const isD1Wide = isD1WidePreset ?? Math.random() < 0.5;
  if (isD1Wide) {
    wideAssignmentQuestionSets.forEach((questions, index) => {
      learningAssignments.push({
        questions,
        type: "learning",
        day: `W${index + 1}D1`,
      });
    });
    narrowAssignmentQuestionSets.forEach((questions, index) => {
      learningAssignments.push({
        questions,
        type: "learning",
        day: `W${index + 1}D2`,
      });
    });
  } else {
    narrowAssignmentQuestionSets.forEach((questions, index) => {
      learningAssignments.push({
        questions,
        type: "learning",
        day: `W${index + 1}D1`,
      });
    });
    wideAssignmentQuestionSets.forEach((questions, index) => {
      learningAssignments.push({
        questions,
        type: "learning",
        day: `W${index + 1}D2`,
      });
    });
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
