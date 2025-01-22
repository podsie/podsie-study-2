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
  type: "pretest" | "learning" | "posttest" | "postposttest";
  day: string; // more info on days:
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
    selectedQuestion: Question; // Randomly selected from Q1-Q4
    selectedSetIndex: number; // Store which set was selected (0-3)
  };
  learning: {
    selectedQuestions: Question[]; // All questions in learning phase
  };
  posttest: {
    selectedQuestion: Question; // Q5
    matchingPretest: Question; // Same as pretest selected question
  };
  postposttest: {
    selectedQuestion: Question; // Q6
    matchingPretest: Question; // Same as pretest selected question
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
