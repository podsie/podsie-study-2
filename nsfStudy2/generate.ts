import { writeFileSync } from "fs";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";

const finalLearningObjectivesWithoutSets = generateSequences();
const timestamp = new Date().getTime();
writeFileSync(
  `./data/${timestamp}-generatedSequence.json`,
  JSON.stringify(finalLearningObjectivesWithoutSets, null, 2),
  "utf-8"
);

const studentAssignments = generateStudentAssignment(
  finalLearningObjectivesWithoutSets
);

writeFileSync(
  `./data/${timestamp}-generatedStudentAssignments.json`,
  JSON.stringify(studentAssignments, null, 2),
  "utf-8"
);
