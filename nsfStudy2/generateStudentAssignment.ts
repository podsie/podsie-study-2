import { Assignment, LearningObjective, Question } from "./nsfStudy2.types";
import { shuffleArray } from "./util";

/**
 * Calculates the index into selectedQuestions based on week (1-6) and whether it's day A or B
 * Week 1, Day A: index 0
 * Week 1, Day B: index 1
 * Week 2, Day A: index 2
 * Week 2, Day B: index 3
 * etc.
 */
const getLearningQuestionIndex = (week: number, isDayB: boolean): number => {
  return (week - 1) * 2 + (isDayB ? 1 : 0);
};

const extractLearningQuestionsFromLO = (
  lo: Omit<LearningObjective, "sets">,
  index: number
): Question[] => {
  const question = lo.sequence!.learning.selectedQuestions[index];
  return [{ ...question, condition: lo.condition }];
};

/**
 * Gets the narrow spacing questions for a given day based on which LO is selected and whether it's high/low variability day
 */
const getNarrowSpacingQuestions = (
  highVariabilityLO: Omit<LearningObjective, "sets"> | undefined,
  lowVariabilityLO: Omit<LearningObjective, "sets"> | undefined,
  isHighVariabilityDay: boolean
): Question[] => {
  const selectedLO = isHighVariabilityDay
    ? highVariabilityLO
    : lowVariabilityLO;
  if (!selectedLO) {
    return [];
  }

  return selectedLO.sequence!.learning.selectedQuestions.map((q) => ({
    ...q,
    condition: selectedLO.condition,
  }));
};

export const generateStudentAssignment = (
  learningObjectives: Omit<LearningObjective, "sets">[]
): Assignment[] => {
  // Generate pretest - one randomly selected question from Q1-Q4 for each standard
  const pretest: Assignment = {
    questions: shuffleArray(
      learningObjectives.map((lo) => ({
        ...lo.sequence!.pretest.selectedQuestion,
        condition: lo.condition,
      }))
    ),
    type: "pretest",
    day: "pretest",
  };

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

  // Track which narrow spacing LOs have been used
  const usedNarrowSpacingLOs = new Set<number>();

  const learningAssignments: Assignment[] = [];
  for (let week = 1; week <= 6; week++) {
    const dayAIsHighVariability = Math.random() < 0.5;

    // Get unused narrow spacing LOs for this week
    const unusedHighVariabilityLOs = narrowSpacingHighVariabilityLOs.filter(
      (lo) => !usedNarrowSpacingLOs.has(lo.loNumber)
    );
    const unusedLowVariabilityLOs = narrowSpacingLowVariabilityLOs.filter(
      (lo) => !usedNarrowSpacingLOs.has(lo.loNumber)
    );

    // Select LOs for this week and mark them as used
    const highVariabilityLO = unusedHighVariabilityLOs[0];
    const lowVariabilityLO = unusedLowVariabilityLOs[0];
    if (highVariabilityLO) usedNarrowSpacingLOs.add(highVariabilityLO.loNumber);
    if (lowVariabilityLO) usedNarrowSpacingLOs.add(lowVariabilityLO.loNumber);

    const dayAQuestions = [
      ...wideSpacingLOs.map((lo) =>
        extractLearningQuestionsFromLO(
          lo,
          getLearningQuestionIndex(week, false)
        )
      ),
      ...getNarrowSpacingQuestions(
        highVariabilityLO,
        lowVariabilityLO,
        dayAIsHighVariability
      ),
    ].flat();

    learningAssignments.push({
      questions: shuffleArray(dayAQuestions),
      type: "learning",
      day: `W${week}D1`,
    });

    const dayBQuestions = [
      ...wideSpacingLOs.map((lo) =>
        extractLearningQuestionsFromLO(lo, getLearningQuestionIndex(week, true))
      ),
      ...getNarrowSpacingQuestions(
        highVariabilityLO,
        lowVariabilityLO,
        !dayAIsHighVariability
      ),
    ].flat();

    learningAssignments.push({
      questions: shuffleArray(dayBQuestions),
      type: "learning",
      day: `W${week}D2`,
    });
  }

  // Generate posttest - Q5 and matching pretest question for each standard
  // Split into two sets of 24 questions each, then combine
  const posttestQuestions = learningObjectives.map((lo) => ({
    q5: { ...lo.sequence!.posttest.selectedQuestion, condition: lo.condition },
    qx: { ...lo.sequence!.posttest.matchingPretest, condition: lo.condition },
  }));

  // Randomly assign each pair to either first or second set
  const posttestSet1: Question[] = [];
  const posttestSet2: Question[] = [];
  posttestQuestions.forEach(({ q5, qx }) => {
    if (Math.random() < 0.5) {
      posttestSet1.push(q5);
      posttestSet2.push(qx);
    } else {
      posttestSet1.push(qx);
      posttestSet2.push(q5);
    }
  });

  // Shuffle each set independently, then combine them in order
  const posttest: Assignment = {
    questions: [
      ...shuffleArray([...posttestSet1]),
      ...shuffleArray([...posttestSet2]),
    ],
    type: "posttest",
    day: "posttest",
  };

  // Generate post-posttest - Q6 and matching pretest question for each standard
  // Split into two sets of 24 questions each, then combine
  const postposttestQuestions = learningObjectives.map((lo) => ({
    q6: {
      ...lo.sequence!.postposttest.selectedQuestion,
      condition: lo.condition,
    },
    qx: {
      ...lo.sequence!.postposttest.matchingPretest,
      condition: lo.condition,
    },
  }));

  // Randomly assign each pair to either first or second set
  const postposttestSet1: Question[] = [];
  const postposttestSet2: Question[] = [];
  postposttestQuestions.forEach(({ q6, qx }) => {
    if (Math.random() < 0.5) {
      postposttestSet1.push(q6);
      postposttestSet2.push(qx);
    } else {
      postposttestSet1.push(qx);
      postposttestSet2.push(q6);
    }
  });

  // Shuffle each set independently, then combine them in order
  const postposttest: Assignment = {
    questions: [
      ...shuffleArray([...postposttestSet1]),
      ...shuffleArray([...postposttestSet2]),
    ],
    type: "postposttest",
    day: "postposttest",
  };

  return [pretest, ...learningAssignments, posttest, postposttest];
};
