import { beforeAll, describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";
import { Assignment, LearningObjective } from "./nsfStudy2.types";

// Add helper function to print the table
function printLOFrequencyTable(
  loFrequency: Record<string, number>,
  learningObjectives: Omit<LearningObjective, "sets">[]
) {
  // Create header
  console.log("\nLO\tSpacing\tVariability\tFrequency");
  console.log("-".repeat(50));

  // Sort by LO ID for consistent output
  const sortedEntries = Object.entries(loFrequency).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  sortedEntries.forEach(([loId, frequency]) => {
    const lo = learningObjectives.find(
      (lo) => `Learning Objective ${lo.loNumber}` === loId
    );
    console.log(
      `${loId}\t${lo?.condition?.spacing}\t${lo?.condition?.variability}\t${frequency}`
    );
  });
}

describe("Generated Student Assignments", () => {
  const isD1Wide = true;
  const sequences = generateSequences();
  const assignments = generateStudentAssignment(sequences, isD1Wide);

  describe("Each LO should be seen 18 times", () => {
    it("should include each LO exactly 18 times across all assignments", () => {
      const learningObjectives = generateSequences();
      const assignments = generateStudentAssignment(learningObjectives);

      // Count occurrences of each LO across all assignments
      const loFrequency: Record<string, number> = {};

      assignments.forEach((assignment) => {
        assignment.questions.forEach((question) => {
          const loId = question.lo;
          loFrequency[loId] = (loFrequency[loId] || 0) + 1;
        });
      });

      // Print the frequency table for debugging
      printLOFrequencyTable(loFrequency, learningObjectives);

      // Check that each LO appears exactly 18 times
      Object.entries(loFrequency).forEach(([loId, frequency]) => {
        expect(
          frequency,
          `LO ${loId} appears ${frequency} times instead of 18 times`
        ).toBe(18);
      });
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
