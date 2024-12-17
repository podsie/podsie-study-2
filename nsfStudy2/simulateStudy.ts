import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";
import { Assignment, Question } from "./nsfStudy2.types";
import { Outcome, SimulatedEvent } from "./simulateStudy.types";

interface SimulationConfig {
  schoolId: number;
  numClasses: number;
  studentsPerClass: number;
  courseName: string;
  experimentId: number;
  baseStartTime: number; // Unix timestamp in milliseconds
  averageResponseTimeMs: number;
  teacherAssignments: Record<number, number[]>; // teacherId -> array of classIds
}

const config: SimulationConfig = {
  schoolId: 1,
  numClasses: 6,
  studentsPerClass: 20,
  courseName: "AP Biology",
  experimentId: 1,
  baseStartTime: Date.now(),
  averageResponseTimeMs: 45000, // 45 seconds average response time
  teacherAssignments: {
    101: [1, 2, 3], // First teacher has classes 1, 2, 3
    102: [4, 5, 6], // Second teacher has classes 4, 5, 6
  },
};

function generateSimulatedResponse(question: Question): {
  selection: string;
  outcome: Outcome;
} {
  // Simulate 70% chance of correct answer
  const isCorrect = Math.random() < 0.7;

  switch (question.type) {
    case "mcq":
      return {
        selection: isCorrect
          ? question.answerKey.toString()
          : ["A", "B", "C", "D"].filter((opt) => opt !== question.answerKey)[0],
        outcome: isCorrect ? Outcome.correct : Outcome.incorrect,
      };
    case "tof":
      return {
        selection: isCorrect
          ? question.answerKey.toString()
          : question.answerKey === "true"
          ? "false"
          : "true",
        outcome: isCorrect ? Outcome.correct : Outcome.incorrect,
      };
    default:
      return {
        selection: isCorrect
          ? question.answerKey.toString()
          : "incorrect answer",
        outcome: isCorrect ? Outcome.correct : Outcome.incorrect,
      };
  }
}

function mapAssignmentType(
  type: Assignment["type"]
): SimulatedEvent["cfStage"] {
  switch (type) {
    case "pretest":
      return "pre-test";
    case "posttest":
      return "post-test";
    case "postposttest":
      return "post-post-test";
    default:
      return "learning";
  }
}

function createSimulatedEvent(
  studentId: number,
  sessionId: number,
  question: Question,
  assignment: Assignment,
  classId: number,
  teacherId: number,
  currentTime: number
): SimulatedEvent {
  const responseTime = Math.floor(
    config.averageResponseTimeMs * (0.5 + Math.random())
  );
  const response = generateSimulatedResponse(question);

  if (!question.condition) {
    throw new Error(
      `Question ${question.id} in ${assignment.type} (${assignment.day}) is missing condition`
    );
  }

  return {
    anonStudentId: studentId,
    sessionId,
    time: currentTime + responseTime,
    problemStartTime: currentTime,
    problemName: question.question.stem,
    level: config.courseName,
    input: response.selection,
    cfQuestionId: question.id,
    conditionType1: "Standard Spacing",
    conditionName1: question.condition.spacing,
    conditionType2: "Question Variability",
    conditionName2: question.condition.variability,
    action: "Select",
    selection: response.selection,
    kcTopic: question.lo,
    kcLearningObjective: question.id.split("-").at(-1) ?? "",
    school: config.schoolId,
    class: classId,
    cfExemplarAnswer: question.answerKey.toString(),
    cfQuestionType: question.type,
    cfOriginalDueDate: currentTime + 7 * 24 * 60 * 60 * 1000, // Due in 7 days
    cfResponseTime: responseTime,
    cfExperimentId: config.experimentId,
    cfStage: mapAssignmentType(assignment.type),
    cfAnonTeacherId: teacherId,
    cfCourse: config.courseName,
    outcome: response.outcome,
    cfAssignmentDay: assignment.day,
  };
}

export function simulateStudy(): SimulatedEvent[] {
  const events: SimulatedEvent[] = [];
  let studentId = 1;
  let sessionId = 1;
  for (let classId = 1; classId <= config.numClasses; classId++) {
    // Find the teacher for this class
    const teacherId = Object.entries(config.teacherAssignments).find(
      ([_, classes]) => classes.includes(classId)
    )?.[0];

    if (!teacherId) {
      throw new Error(`No teacher assigned to class ${classId}`);
    }

    for (
      let studentNum = 1;
      studentNum <= config.studentsPerClass;
      studentNum++
    ) {
      // Generate a new sequence for each student
      const sequence = generateSequences();
      const assignments = generateStudentAssignment(sequence);

      let currentTime = config.baseStartTime;

      // Process each assignment
      assignments.forEach((assignment) => {
        // Add some variation to starting times between assignments
        currentTime += Math.floor(
          24 * 60 * 60 * 1000 * (0.9 + Math.random() * 0.2)
        );

        assignment.questions.forEach((question) => {
          const event = createSimulatedEvent(
            studentId,
            sessionId,
            question,
            assignment,
            classId,
            Number(teacherId),
            currentTime
          );
          events.push(event);

          // Add some random time between questions
          currentTime += Math.floor(
            config.averageResponseTimeMs * (0.8 + Math.random() * 0.4)
          );
        });
        sessionId++;
      });
      studentId++;
    }
  }

  return events;
}
