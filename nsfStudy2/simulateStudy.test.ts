import { describe, expect, it } from "vitest";
import { simulateStudy } from "./simulateStudy";
import { SimulatedEvent } from "./simulateStudy.types";

describe("Simulated Study Events", () => {
  const events = simulateStudy();

  // Helper function to get events for a specific student and stage
  const getEventsForStudentAndStage = (
    studentId: number,
    stage: SimulatedEvent["cfStage"]
  ): SimulatedEvent[] => {
    return events.filter(
      (event) => event.anonStudentId === studentId && event.cfStage === stage
    );
  };

  // Helper to get all unique student IDs
  const getUniqueStudentIds = (): number[] => {
    return [...new Set(events.map((event) => event.anonStudentId))];
  };

  describe("Basic Event Counts", () => {
    it("each student should have 48 events for pretest", () => {
      const studentIds = getUniqueStudentIds();
      studentIds.forEach((studentId) => {
        const pretestEvents = getEventsForStudentAndStage(
          studentId,
          "pre-test"
        );
        expect(pretestEvents).toHaveLength(48);
      });
    });

    it("each student should have 24 events for each learning session, with 12 learning sessions", () => {
      const studentIds = getUniqueStudentIds();
      studentIds.forEach((studentId) => {
        const learningEvents = getEventsForStudentAndStage(
          studentId,
          "learning"
        );
        expect(learningEvents).toHaveLength(24 * 12); // 24 events × 12 sessions = 288 total
      });
    });

    it("each student should have 48 events for post-test", () => {
      const studentIds = getUniqueStudentIds();
      studentIds.forEach((studentId) => {
        const posttestEvents = getEventsForStudentAndStage(
          studentId,
          "post-test"
        );
        expect(posttestEvents).toHaveLength(48);
      });
    });

    it("each student should have 48 events for post-post-test", () => {
      const studentIds = getUniqueStudentIds();
      studentIds.forEach((studentId) => {
        const postposttestEvents = getEventsForStudentAndStage(
          studentId,
          "post-post-test"
        );
        expect(postposttestEvents).toHaveLength(48);
      });
    });
  });

  describe("Learning Phase Requirements", () => {
    it("each student should have correct distribution of spacing and variability conditions", () => {
      const studentIds = getUniqueStudentIds();

      studentIds.forEach((studentId) => {
        const learningEvents = getEventsForStudentAndStage(
          studentId,
          "learning"
        );

        // Count events by condition combination
        const conditionCounts = learningEvents.reduce((acc, event) => {
          const key = `${event.conditionName1}-${event.conditionName2}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Should have all four condition combinations
        expect(Object.keys(conditionCounts)).toHaveLength(4);

        // Each combination should appear exactly 72 times (24 questions × 3 sessions)
        expect(conditionCounts["wide-high"]).toBe(72);
        expect(conditionCounts["wide-low"]).toBe(72);
        expect(conditionCounts["narrow-high"]).toBe(72);
        expect(conditionCounts["narrow-low"]).toBe(72);
      });
    });

    it("each student should have correct number of unique LOs per condition", () => {
      const studentIds = getUniqueStudentIds();

      studentIds.forEach((studentId) => {
        const learningEvents = getEventsForStudentAndStage(
          studentId,
          "learning"
        );

        // Group events by condition combination and get unique LOs
        const conditionLOs = learningEvents.reduce((acc, event) => {
          const key = `${event.conditionName1}-${event.conditionName2}`;
          if (!acc[key]) {
            acc[key] = new Set<string>();
          }
          acc[key].add(event.kcTopic);
          return acc;
        }, {} as Record<string, Set<string>>);

        // Each condition combination should have exactly 6 unique LOs
        expect(conditionLOs["wide-high"].size).toBe(6);
        expect(conditionLOs["wide-low"].size).toBe(6);
        expect(conditionLOs["narrow-high"].size).toBe(6);
        expect(conditionLOs["narrow-low"].size).toBe(6);
      });
    });

    it("each student should have a unique sequence of condition assignments", () => {
      const studentIds = getUniqueStudentIds();

      // Create a map of condition sequences by student
      const studentSequences = new Map<number, string>();

      studentIds.forEach((studentId) => {
        const learningEvents = getEventsForStudentAndStage(
          studentId,
          "learning"
        );

        // Create a string representation of the condition sequence
        const sequenceKey = learningEvents
          .map(
            (event) =>
              `${event.conditionName1}-${event.conditionName2}-${event.kcTopic}`
          )
          .join("|");

        // Store the sequence for this student
        studentSequences.set(studentId, sequenceKey);
      });

      // Check that all sequences are unique
      const uniqueSequences = new Set(studentSequences.values());
      expect(uniqueSequences.size).toBe(studentIds.length);
    });

    it("should have correctly paired condition names and types", () => {
      const events = simulateStudy();
      const sampleEvent = events[0];

      // First pair
      expect(sampleEvent.conditionType1).toBe("Standard Spacing");
      expect(typeof sampleEvent.conditionName1).toBe("string");
      expect(["wide", "narrow"]).toContain(sampleEvent.conditionName1);

      // Second pair
      expect(sampleEvent.conditionType2).toBe("Question Variability");
      expect(typeof sampleEvent.conditionName2).toBe("string");
      expect(["high", "low"]).toContain(sampleEvent.conditionName2);
    });
  });
});