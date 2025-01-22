import { beforeAll, describe, expect, it } from "vitest";
import { generateSequences } from "./generateSequence";
import { generateStudentAssignment } from "./generateStudentAssignment";
import { Assignment, LearningObjective, Question } from "./nsfStudy2.types";

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
  const sequences = generateSequences();
  const assignments = generateStudentAssignment(sequences);

  // Print frequency table for debugging purposes
  beforeAll(() => {
    const loFrequency: Record<string, number> = {};
    assignments.forEach((assignment) => {
      assignment.questions.forEach((question) => {
        const loId = question.lo;
        loFrequency[loId] = (loFrequency[loId] || 0) + 1;
      });
    });
    printLOFrequencyTable(loFrequency, sequences);
  });

  describe("Learning Phase", () => {
    const learningAssignments = assignments
      .filter((a) => a.type === "learning")
      .sort((a, b) => a.day.localeCompare(b.day));

    it("should have 12 days total (6 weeks × 2 days)", () => {
      expect(learningAssignments.length).toBe(12);
    });

    it("each wide spacing LO should appear once per day", () => {
      const wideSpacingLOs = sequences.filter(
        (lo) => lo.condition?.spacing === "wide"
      );

      learningAssignments.forEach((assignment) => {
        const wideLOsInDay = new Set(
          assignment.questions
            .filter((q) => {
              const lo = sequences.find(
                (lo) => `Learning Objective ${lo.loNumber}` === q.lo
              );
              return lo?.condition?.spacing === "wide";
            })
            .map((q) => q.lo)
        );

        expect(wideLOsInDay.size).toBe(wideSpacingLOs.length);
      });
    });

    it("each narrow spacing LO should appear exactly once in the learning phase", () => {
      const narrowLOAppearances = new Map<string, number>();

      learningAssignments.forEach((assignment) => {
        const narrowQuestions = assignment.questions.filter((q) => {
          const lo = sequences.find(
            (lo) => `Learning Objective ${lo.loNumber}` === q.lo
          );
          return lo?.condition?.spacing === "narrow";
        });

        narrowQuestions.forEach((q) => {
          narrowLOAppearances.set(
            q.lo,
            (narrowLOAppearances.get(q.lo) || 0) + 1
          );
        });
      });

      // Each narrow spacing LO should appear in exactly one day
      narrowLOAppearances.forEach((count, loId) => {
        const lo = sequences.find(
          (lo) => `Learning Objective ${lo.loNumber}` === loId
        );
        if (lo?.condition?.spacing === "narrow") {
          expect(count).toBe(12); // Should appear 12 times in one day
        }
      });
    });

    it("each week should have opposite variability conditions for narrow spacing LOs", () => {
      for (let week = 1; week <= 6; week++) {
        const day1 = learningAssignments.find((a) => a.day === `W${week}D1`);
        const day2 = learningAssignments.find((a) => a.day === `W${week}D2`);

        const getNarrowLOVariability = (assignment: Assignment) => {
          const narrowQuestions = assignment.questions.filter((q) => {
            const lo = sequences.find(
              (lo) => `Learning Objective ${lo.loNumber}` === q.lo
            );
            return lo?.condition?.spacing === "narrow";
          });
          return narrowQuestions[0]?.condition?.variability;
        };

        const day1Variability = getNarrowLOVariability(day1!);
        const day2Variability = getNarrowLOVariability(day2!);

        expect(day1Variability).not.toBe(day2Variability);
      }
    });
  });

  describe("Posttest and Post-posttest", () => {
    const posttest = assignments.find((a) => a.type === "posttest")!;
    const postposttest = assignments.find((a) => a.type === "postposttest")!;

    it("should have questions split into two equal sets", () => {
      const halfLength = sequences.length;

      // First half should be Set 1, second half should be Set 2
      const firstHalf = posttest.questions.slice(0, halfLength);
      const secondHalf = posttest.questions.slice(halfLength);

      expect(firstHalf.length).toBe(secondHalf.length);
      expect(firstHalf.length).toBe(sequences.length);

      // Same for post-posttest
      const ppFirstHalf = postposttest.questions.slice(0, halfLength);
      const ppSecondHalf = postposttest.questions.slice(halfLength);

      expect(ppFirstHalf.length).toBe(ppSecondHalf.length);
      expect(ppFirstHalf.length).toBe(sequences.length);
    });

    it("each LO should have one question in each set", () => {
      const halfLength = sequences.length;

      // Check posttest
      const firstHalfLOs = new Set(
        posttest.questions.slice(0, halfLength).map((q) => q.lo)
      );
      const secondHalfLOs = new Set(
        posttest.questions.slice(halfLength).map((q) => q.lo)
      );

      expect(firstHalfLOs.size).toBe(sequences.length);
      expect(secondHalfLOs.size).toBe(sequences.length);

      // Check post-posttest
      const ppFirstHalfLOs = new Set(
        postposttest.questions.slice(0, halfLength).map((q) => q.lo)
      );
      const ppSecondHalfLOs = new Set(
        postposttest.questions.slice(halfLength).map((q) => q.lo)
      );

      expect(ppFirstHalfLOs.size).toBe(sequences.length);
      expect(ppSecondHalfLOs.size).toBe(sequences.length);
    });

    it("each set should be independently randomized", () => {
      const halfLength = sequences.length;

      // Helper to check if arrays are in different order
      const areArraysInDifferentOrder = (
        arr1: Question[],
        arr2: Question[]
      ) => {
        return arr1.some((q, i) => q.lo !== arr2[i].lo);
      };

      // Check that Set 1 and Set 2 are in different orders
      const posttestSet1 = posttest.questions.slice(0, halfLength);
      const posttestSet2 = posttest.questions.slice(halfLength);
      expect(areArraysInDifferentOrder(posttestSet1, posttestSet2)).toBe(true);

      const ppSet1 = postposttest.questions.slice(0, halfLength);
      const ppSet2 = postposttest.questions.slice(halfLength);
      expect(areArraysInDifferentOrder(ppSet1, ppSet2)).toBe(true);
    });
  });
});
