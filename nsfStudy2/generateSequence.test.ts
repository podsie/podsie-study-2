import { describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";

const extractQuestionNumbers = (id: string): string => {
  const parts = id.split("-");
  // Get both the LO number and the set number (e.g., "1001" and "101" from "spacing-1001-mcq-101")
  return `${parts[1]}-${parts[3]}`;
};

describe("Generated Student Sequence", () => {
  const sequences = generateSequences();

  describe("Sequence Generation", () => {
    // In every LO, the pretest's selected question should be the same as the posttest's matching pretest
    sequences.forEach((s) => {
      const pretestSelectedQuestion = s.sequence?.pretest.selectedQuestion;
      const pretestQuestionNumbers = pretestSelectedQuestion?.id
        ? extractQuestionNumbers(pretestSelectedQuestion.id)
        : "";

      // Whatever is selected for the pretest should be in the posttest
      it(`should have the same selected question in the pretest and posttest for LO${s.loNumber}`, () => {
        const posttestMatchingQuestion = s.sequence?.posttest.matchingPretest;
        expect(posttestMatchingQuestion).toBeDefined();
        if (posttestMatchingQuestion) {
          const posttestMatchingQuestionNumbers = extractQuestionNumbers(
            posttestMatchingQuestion.id
          );
          expect(pretestQuestionNumbers).toBe(posttestMatchingQuestionNumbers);
        }
      });

      // For low variability, all learning phase questions should be from the same set as pretest
      if (s.condition?.variability === "low") {
        describe("Low Variability", () => {
          it(`should use the same question set in learning phase as the selected pretest question for LO${s.loNumber}`, () => {
            // Check all blocks and all questions within blocks
            s.sequence?.learning.blocks.forEach((block) => {
              block.questions.forEach((question) => {
                const learningPhaseQuestionNumbers = extractQuestionNumbers(
                  question.id
                );
                expect(learningPhaseQuestionNumbers).toBe(
                  pretestQuestionNumbers
                );
              });
            });
          });
        });
      }

      // Check that postposttest also uses the same pretest question
      it(`should have the same selected question in the pretest and post-posttest for LO${s.loNumber}`, () => {
        const postposttestMatchingQuestion =
          s.sequence?.postposttest.matchingPretest;
        expect(postposttestMatchingQuestion).toBeDefined();
        if (postposttestMatchingQuestion) {
          const postposttestMatchingQuestionNumbers = extractQuestionNumbers(
            postposttestMatchingQuestion.id
          );
          expect(pretestQuestionNumbers).toBe(
            postposttestMatchingQuestionNumbers
          );
        }
      });
    });
  });
});
