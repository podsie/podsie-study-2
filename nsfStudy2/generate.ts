import { writeFileSync } from "fs";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";

const finalLearningObjectivesWithoutSets = generateSequences();
writeFileSync(
  `./data/${new Date().toISOString()}-generatedSequence.json`,
  JSON.stringify(finalLearningObjectivesWithoutSets, null, 2),
  "utf-8"
);

const studentAssignments = generateStudentAssignment(
  finalLearningObjectivesWithoutSets
);

writeFileSync(
  `./data/${new Date().toISOString()}-generatedStudentAssignments.json`,
  JSON.stringify(studentAssignments, null, 2),
  "utf-8"
);
