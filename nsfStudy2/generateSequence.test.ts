import { beforeAll, describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";
import { Assignment } from "./nsfStudy2.types";

describe("Generated Student Assignments", () => {
  const sequences = generateSequences();
  const assignments = generateStudentAssignment(sequences);

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
});
