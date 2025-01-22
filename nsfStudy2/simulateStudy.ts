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

function calculateDueDate(
  assignmentDay: string,
  baseStartTime: number
): number {
  // For pre-test, due date is same as start date
  if (assignmentDay === "pretest") {
    return baseStartTime;
  }

  // For post-test, it's the day after W6D2
  if (assignmentDay === "posttest") {
    const w6d2Offset = (6 * 7 - 7 + 2) * 24 * 60 * 60 * 1000; // 6 weeks * 7 days - 7 days + 2 days
    return baseStartTime + w6d2Offset + 24 * 60 * 60 * 1000; // Plus one more day
  }

  // For post-post-test, it's one week after post-test
  if (assignmentDay === "postposttest") {
    const posttestOffset = (6 * 7 - 7 + 2 + 1) * 24 * 60 * 60 * 1000; // Post-test offset
    return baseStartTime + posttestOffset + 7 * 24 * 60 * 60 * 1000; // Plus one week
  }

  // For weekly assignments (e.g., "W1D1", "W2D2", etc.)
  const match = assignmentDay.match(/W(\d+)D(\d+)/);
  if (match) {
    const week = parseInt(match[1]);
    const day = parseInt(match[2]);

    // Calculate offset:
    // - Weeks are zero-based (W1 = week 0)
    // - Days are one-based (D1 = first day)
    const weekOffset = (week - 1) * 7 * 24 * 60 * 60 * 1000; // Each week
    const dayOffset = day * 24 * 60 * 60 * 1000; // Days within week

    return baseStartTime + weekOffset + dayOffset;
  }

  throw new Error(`Invalid assignment day format: ${assignmentDay}`);
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
  // Base response time (time to answer)
  const responseTime = Math.floor(
    config.averageResponseTimeMs * (0.5 + Math.random())
  );

  // Additional time spent reviewing after answering (10-30% of response time)
  const reviewTime = Math.floor(responseTime * (0.1 + Math.random() * 0.2));

  const response = generateSimulatedResponse(question);

  // Calculate all timing values
  const startTime = currentTime;
  const responseTimestamp = startTime + responseTime;
  const completionTimestamp = responseTimestamp + reviewTime;

  // Calculate due date based on assignment day pattern
  const dueDate = calculateDueDate(assignment.day, config.baseStartTime);

  if (!question.condition) {
    throw new Error(
      `Question ${question.id} in ${assignment.type} (${assignment.day}) is missing condition`
    );
  }

  return {
    anonStudentId: studentId,
    sessionId,
    time: responseTimestamp,
    problemStartTime: startTime,
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
    cfOriginalDueDate: dueDate,
    cfResponseTime: responseTime,
    cfExperimentId: config.experimentId,
    cfStage: mapAssignmentType(assignment.type),
    cfAnonTeacherId: teacherId,
    cfCourse: config.courseName,
    outcome: response.outcome,
    cfAssignmentDay: assignment.day,
    cfCompletionTime: completionTimestamp,
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
      const sequence = generateSequences();
      const assignments = generateStudentAssignment(sequence);

      // Process each assignment
      assignments.forEach((assignment) => {
        // Get the due date for this assignment
        const dueDate = calculateDueDate(assignment.day, config.baseStartTime);

        // Start the assignment 1-3 hours before due date
        const hoursBeforeDue = 1 + Math.random() * 2; // 1-3 hours
        let currentTime = dueDate - hoursBeforeDue * 60 * 60 * 1000;

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

          // Update currentTime to the completion time of this question
          currentTime = event.cfCompletionTime;
        });
        sessionId++;
      });
      studentId++;
    }
  }

  return events;
}
