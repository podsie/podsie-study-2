import { beforeAll, describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";
import { Assignment } from "./nsfStudy2.types";

describe("Generated Student Assignments", () => {
  const sequences = generateSequences();
  const assignments = generateStudentAssignment(sequences);

  describe.only("Sequence Generation", () => {
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

  describe("Pretest", () => {
    let pretest: Assignment;

    beforeAll(() => {
      pretest = assignments.find((a) => a.type === "pretest") as Assignment;
    });

    it("should have exactly 48 questions", () => {
      expect(pretest.questions.length).toBe(48);
    });

    it("should have questions from all 24 LOs", () => {
      const uniqueLOs = new Set(pretest.questions.map((q) => q.lo));
      expect(uniqueLOs.size).toBe(24);
    });

    it("should have 2 questions per LO", () => {
      const questionsPerLO = pretest.questions.reduce((acc, q) => {
        acc[q.lo] = (acc[q.lo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.values(questionsPerLO).forEach((count) => {
        expect(count).toBe(2);
      });
    });
  });

  describe("Learning Phase", () => {
    describe("Wide Spacing Days (D1)", () => {
      const wideDays = assignments.filter(
        (a) => a.day.endsWith("D1") && a.type === "learning"
      );

      it("should have 6 wide spacing days", () => {
        expect(wideDays.length).toBe(6);
      });

      it("should have 24 questions per day", () => {
        wideDays.forEach((day) => {
          expect(day.questions.length).toBe(24);
        });
      });

      it("should include 2 questions from each wide-spacing LO", () => {
        wideDays.forEach((day) => {
          const questionsPerLO = day.questions.reduce((acc, q) => {
            acc[q.lo] = (acc[q.lo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          Object.values(questionsPerLO).forEach((count) => {
            expect(count).toBe(2);
          });
        });
      });

      it("should have equal distribution of high and low variability LOs", () => {
        wideDays.forEach((day) => {
          const highVariabilityQuestions = day.questions.filter(
            (q) => q.condition?.variability === "high"
          );
          const lowVariabilityQuestions = day.questions.filter(
            (q) => q.condition?.variability === "low"
          );

          // Should have 12 questions from each variability condition
          expect(highVariabilityQuestions.length).toBe(12);
          expect(lowVariabilityQuestions.length).toBe(12);

          // Should have 6 unique LOs for each variability condition
          const highVariabilityLOs = new Set(
            highVariabilityQuestions.map((q) => q.lo)
          );
          const lowVariabilityLOs = new Set(
            lowVariabilityQuestions.map((q) => q.lo)
          );
          expect(highVariabilityLOs.size).toBe(6);
          expect(lowVariabilityLOs.size).toBe(6);
        });
      });
    });

    describe("Narrow Spacing Days (D2)", () => {
      const narrowDays = assignments.filter(
        (a) => a.day.endsWith("D2") && a.type === "learning"
      );

      it("should have 6 narrow spacing days", () => {
        expect(narrowDays.length).toBe(6);
      });

      it("should have 24 questions per day", () => {
        narrowDays.forEach((day) => {
          expect(day.questions.length).toBe(24);
        });
      });

      it("should include 12 questions from each narrow-spacing LO", () => {
        narrowDays.forEach((day) => {
          const questionsPerLO = day.questions.reduce((acc, q) => {
            acc[q.lo] = (acc[q.lo] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Each narrow spacing day should have 2 LOs with 12 questions each
          expect(Object.keys(questionsPerLO).length).toBe(2);
          Object.values(questionsPerLO).forEach((count) => {
            expect(count).toBe(12);
          });
        });
      });

      it("should pair one high variability LO with one low variability LO each day", () => {
        narrowDays.forEach((day) => {
          const questionsPerLOAndVariability = day.questions.reduce(
            (acc, q) => {
              const key = `${q.lo}-${q.condition?.variability}`;
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          );

          // Should have exactly 2 LOs
          expect(Object.keys(questionsPerLOAndVariability).length).toBe(2);

          // Get unique LOs and their variability
          const loVariability = Object.keys(questionsPerLOAndVariability).map(
            (key) => ({
              lo: key.split("-")[0],
              variability: key.split("-")[1],
            })
          );

          // One LO should be high variability, one should be low
          const variabilities = loVariability.map((lv) => lv.variability);
          expect(variabilities).toContain("high");
          expect(variabilities).toContain("low");

          // Each LO should have 12 questions
          Object.values(questionsPerLOAndVariability).forEach((count) => {
            expect(count).toBe(12);
          });
        });
      });
    });
  });

  describe("Posttest", () => {
    let posttest: Assignment;

    beforeAll(() => {
      posttest = assignments.find((a) => a.type === "posttest") as Assignment;
    });

    it("should have exactly 48 questions", () => {
      expect(posttest.questions.length).toBe(48);
    });

    it("should have questions from all 24 LOs", () => {
      const uniqueLOs = new Set(posttest.questions.map((q) => q.lo));
      expect(uniqueLOs.size).toBe(24);
    });

    it("should have 2 questions per LO", () => {
      const questionsPerLO = posttest.questions.reduce((acc, q) => {
        acc[q.lo] = (acc[q.lo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.values(questionsPerLO).forEach((count) => {
        expect(count).toBe(2);
      });
    });
  });

  describe("Postposttest", () => {
    let postposttest: Assignment;

    beforeAll(() => {
      postposttest = assignments.find(
        (a) => a.type === "postposttest"
      ) as Assignment;
    });

    it("should have exactly 48 questions", () => {
      expect(postposttest.questions.length).toBe(48);
    });

    it("should have questions from all 24 LOs", () => {
      const uniqueLOs = new Set(postposttest.questions.map((q) => q.lo));
      expect(uniqueLOs.size).toBe(24);
    });

    it("should have 2 questions per LO", () => {
      const questionsPerLO = postposttest.questions.reduce((acc, q) => {
        acc[q.lo] = (acc[q.lo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.values(questionsPerLO).forEach((count) => {
        expect(count).toBe(2);
      });
    });
  });
});
