import { QuestionType as NSFQuestionType } from "./nsfStudy2.types";

export enum Outcome {
  correct = "CORRECT",
  incorrect = "INCORRECT",
}

export interface SimulatedEvent {
  // Student and Session Information
  anonStudentId: number;
  sessionId: number;
  time: number; // Unix timestamp in milliseconds
  problemStartTime: number; // Unix timestamp in milliseconds

  // Problem Information
  problemName: string;
  level: string; // Course name
  input: string; // Student's input submission

  // Condition Information
  conditionName1: "Standard Spacing";
  conditionType1: "wide" | "narrow";
  conditionName2: "Question Variability";
  conditionType2: "high" | "low";

  // Action and Response
  action: "Select"; // In DataShop format, this is typically "Select" for all question types
  selection: string; // Student's response: multiple choice letter, true/false, or text answer

  // Knowledge Components
  kcTopic: string;
  kcLearningObjective: string;

  // School Information
  school: number;
  class: number;

  // Custom Fields (CF)
  cfExemplarAnswer: string;
  cfQuestionType: NSFQuestionType;
  cfOriginalDueDate: number; // Unix timestamp in milliseconds
  cfResponseTime: number; // Unix timestamp in milliseconds
  cfExperimentId: number;
  cfStage: "pre-test" | "learning" | "post-test" | "post-post-test";
  cfAnonTeacherId: number;
  cfCourse: string;
  cfQuestionId: string;
  cfAssignmentDay: string;

  // Outcome
  outcome: Outcome;
}

export const keysDict: Record<keyof SimulatedEvent, string> = {
  anonStudentId: "Anon Student Id",
  sessionId: "Session Id",
  time: "Time",
  problemStartTime: "Problem Start Time",
  problemName: "Problem Name",
  level: "Level (Course)",
  input: "Input",
  conditionName1: "Condition Name",
  conditionType1: "Condition Type",
  conditionName2: "Condition Name",
  conditionType2: "Condition Type",
  action: "Action",
  selection: "Selection",
  kcTopic: "KC (Topic)",
  kcLearningObjective: "KC (LO)",
  school: "School",
  class: "Class",
  cfExemplarAnswer: "CF (Exemplar Answer)",
  cfQuestionType: "CF (Question Type)",
  cfOriginalDueDate: "CF (Original Due Date)",
  cfResponseTime: "CF (Response Time)",
  cfExperimentId: "CF (Experiment ID)",
  cfStage: "CF (Stage)",
  cfAnonTeacherId: "CF (Anon Teacher Id)",
  cfCourse: "CF (Course)",
  cfQuestionId: "CF (Question Id)",
  cfAssignmentDay: "CF (Assignment Day)",
  outcome: "Outcome",
};
