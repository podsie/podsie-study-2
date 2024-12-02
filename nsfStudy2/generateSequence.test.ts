import { describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";

describe("Generated Student Sequence", () => {
  const sequences = generateSequences();

  describe("Sequence Generation", () => {
    // in every LO, the pretest's randomly selected question set should be the same as the posttest's matching pretest:
    sequences.forEach((s) => {
      const pretestRandomlySelectedQuestionSet =
        s.sequence?.pretest.randomQuestionSet;
      const pretestRandomlySelectedQuestionSetId =
        pretestRandomlySelectedQuestionSet?.id.split("-").pop();
      // whatever is selected for the pretest should be in the posttest
      it(`should have the same randomly selected question set in the pretest and posttest for LO${s.loNumber}`, () => {
        // parse out the id from the integers after the very last "-":
        const posttestRandomlySelectedQuestionSetId =
          s.sequence?.posttest.matchingPretest.id.split("-").pop();
        expect(pretestRandomlySelectedQuestionSetId).toBe(
          posttestRandomlySelectedQuestionSetId
        );
      });
      // whatever is selected for the pretest should be in the learning phase
      if (s.condition?.variability === "low") {
        describe("Low Variability", () => {
          it(`should cover the same question set in the learning phase as the random selected question set in the pretest for LO${s.loNumber}`, () => {
            // parse id from the integer after the last "-":
            const learningPhaseQuestionSetId =
              s.sequence?.learning.blocks[0].questions[0].id.split("-").pop();
            expect(learningPhaseQuestionSetId).toBe(
              pretestRandomlySelectedQuestionSetId
            );
          });
        });
      }
    });
  });
});
