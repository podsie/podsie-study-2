import { readFileSync } from "fs";
import { LearningObjective, Question, QuestionSet } from "./nsfStudy2.types";

export const parseQuestions = (): LearningObjective[] => {
  // Read the JSONL file
  const fileContent = readFileSync(
    "./nsfStudy2/placeholder-questions.jsonl",
    "utf-8"
  );
  const questions: Question[] = fileContent
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));

  // Group questions by LO
  const loMap = new Map<number, Question[]>();
  questions.forEach((question) => {
    const loMatch = question.lo.match(/\d+/);
    if (!loMatch) {
      throw new Error(`Invalid LO format for question: ${question.id}`);
    }
    const loNumber = parseInt(loMatch[0]);
    if (!loMap.has(loNumber)) {
      loMap.set(loNumber, []);
    }
    const questions = loMap.get(loNumber);
    if (!questions) {
      throw new Error(`Failed to get questions array for LO ${loNumber}`);
    }
    questions.push(question);
  });

  // Convert map to array of LearningObjectives
  const learningObjectives: LearningObjective[] = [];
  loMap.forEach((questions, loNumber) => {
    // Group questions by set
    const setMap = new Map<number, Question[]>();
    questions.forEach((question) => {
      const setNumber = parseInt(question.id.split("-")[3].substring(1));
      if (!setMap.has(setNumber)) {
        setMap.set(setNumber, []);
      }
      const questions = setMap.get(setNumber);
      if (!questions) {
        throw new Error(`Failed to get questions array for set ${setNumber}`);
      }
      questions.push(question);
    });

    // Convert sets map to array of QuestionSets
    const sets: QuestionSet[] = [];
    setMap.forEach((questions) => {
      // Sort questions by type to maintain consistent order
      const sortedQuestions = questions.sort((a, b) => {
        const typeOrder = {
          "Multiple Choice": 0,
          "True or False": 1,
          "Fill in Blank": 2,
          "Short Answer": 3,
        } as const;
        return (
          typeOrder[a.type as keyof typeof typeOrder] -
          typeOrder[b.type as keyof typeof typeOrder]
        );
      });

      sets.push({ questions: sortedQuestions });
    });

    learningObjectives.push({
      loNumber,
      sets: sets.sort((a, b) => {
        const setNumberA = parseInt(
          a.questions[0].id.split("-")[3].substring(1)
        );
        const setNumberB = parseInt(
          b.questions[0].id.split("-")[3].substring(1)
        );
        return setNumberA - setNumberB;
      }),
    });
  });

  return learningObjectives.sort((a, b) => a.loNumber - b.loNumber);
};
