import { writeFileSync } from "fs";

interface Question {
  id: string;
  type: string;
  question: {
    stem: string;
    choices?: Array<{ label: string; text: string }>;
  };
  answerKey: string | boolean;
  lo: string;
}

const generatePlaceholderQuestion = (
  loNumber: number,
  setNumber: number,
  type: "mcq" | "tof" | "fib" | "sha",
): Question => {
  const typeMap = {
    mcq: "Multiple Choice",
    tof: "True or False",
    fib: "Fill in Blank",
    sha: "Short Answer",
  };

  // Format ID to match the sample format: "spacing-[number]-[type]-[number]"
  const id = `spacing-${1000 + loNumber}-${type}-${100 + setNumber}`;

  const baseQuestion: Question = {
    id,
    type: typeMap[type],
    question: {
      stem: type === "fib"
        ? `This is a placeholder ${type.toUpperCase()} question for LO${loNumber} Set${setNumber} with _____`
        : `This is a placeholder ${type.toUpperCase()} question for LO${loNumber} Set${setNumber}?`,
    },
    answerKey: "placeholder",
    lo: `Learning Objective ${loNumber}`,
  };

  // Add choices for multiple choice questions
  if (type === "mcq") {
    baseQuestion.question.choices = [
      { label: "a", text: `Choice A for LO${loNumber} Set${setNumber}` },
      { label: "b", text: `Choice B for LO${loNumber} Set${setNumber}` },
      { label: "c", text: `Choice C for LO${loNumber} Set${setNumber}` },
      { label: "d", text: `Choice D for LO${loNumber} Set${setNumber}` },
    ];
    baseQuestion.answerKey = "a";
  }

  // Set boolean answer for true/false questions
  if (type === "tof") {
    baseQuestion.answerKey = true;
  }

  return baseQuestion;
};

const generateAllQuestions = (): Question[] => {
  const questions: Question[] = [];

  // For each LO (1-24)
  for (let loNumber = 1; loNumber <= 24; loNumber++) {
    // For each set (1-6)
    for (let setNumber = 1; setNumber <= 6; setNumber++) {
      // For each question type
      const types: Array<"mcq" | "tof" | "fib" | "sha"> = [
        "mcq",
        "tof",
        "fib",
        "sha",
      ];
      types.forEach((type) => {
        questions.push(generatePlaceholderQuestion(loNumber, setNumber, type));
      });
    }
  }

  return questions;
};

// Generate all questions
const questions = generateAllQuestions();

// Convert to JSONL format
const jsonl = questions.map((q) => JSON.stringify(q)).join("\n");

// Write to file
writeFileSync("placeholder-questions.jsonl", jsonl);

// Verification output
console.log("\nDataset Verification:");
console.log("===================");
console.log(`Total Questions: ${questions.length}`);
console.log(`Total LOs: ${new Set(questions.map((q) => q.lo)).size}`);
console.log(`Questions per LO: ${questions.length / 24}`);

// Example of the first question
console.log("\nExample Question:");
console.log(JSON.stringify(questions[0], null, 2));
