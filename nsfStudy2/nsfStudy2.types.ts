export interface Choice {
  label: string;
  text: string;
}

export type QuestionType = "mcq" | "tof" | "fib" | "sha";

export interface Question {
  id: string;
  type: QuestionType;
  question: {
    stem: string;
    choices?: Choice[];
  };
  answerKey: string | boolean;
  lo: string;
  condition?: {
    spacing: SpacingCondition;
    variability: VariabilityCondition;
  };
}

export interface Assignment {
  questions: Question[];
  type: "pretest" | "learning" | "posttest";
  day: string; // more info on days:
  // eg. pretest, W1D1, W1D2, WXD1, WXD2, all the way to W6D1 and W6D2 (total of 12 learning days), posttest
  // On WXD1, we want wide spacing + even split of high and low variability. This means 2 questions per LO: show all 12 LOs assigned to wide spacing.
  // On WXD2, we want narrow spacing + even split of high and low variability. This means 12 questions per LO: show 2 LOs assigned to narrow spacing.
}
export interface QuestionSet {
  questions: Question[];
}

export type SpacingCondition = "wide" | "narrow";
export type VariabilityCondition = "high" | "low";

export interface QuestionBlock {
  questions: Question[]; // A set of 4 questions that will be presented together
  blockNumber: number; // To maintain order of blocks (1, 2, or 3)
}

interface PhaseSequence {
  pretest: {
    questionSet1: Question; // Always QS1
    randomQuestionSet: Question; // Randomly selected from QS2-5
    selectedPretestSetNumber: number; // Store which set was selected (2-5)
  };
  learning: {
    blocks: QuestionBlock[]; // 3 blocks of 4 questions each
  };
  posttest: {
    questionSet6: Question; // Always QS6
    matchingPretest: Question; // Same set number as pretest random set
  };
}

// Main types
export interface LearningObjective {
  loNumber: number;
  condition?: {
    spacing: "wide" | "narrow";
    variability: "high" | "low";
  };
  sets: QuestionSet[];
  sequence?: PhaseSequence;
}

export interface StudySequence {
  group1: LearningObjective[]; // 6 LOs
  group2: LearningObjective[]; // 6 LOs
  group3: LearningObjective[]; // 6 LOs
  group4: LearningObjective[]; // 6 LOs
}
