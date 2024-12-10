import { writeFileSync } from "fs";
import { simulateStudy } from "./simulateStudy";
import { SimulatedEvent, keysDict } from "./simulateStudy.types";

const timestamp = new Date().getTime();

export function writeEventsToFile(
  events: SimulatedEvent[],
  filename: string = `./data/${timestamp}-simulated_events.tsv`
): void {
  const tsvContent = convertToTSV(events);
  writeFileSync(filename, tsvContent, "utf-8");
}

const simulatedEvents = simulateStudy();
writeEventsToFile(simulatedEvents);

function convertToTSV(events: SimulatedEvent[]): string {
  const headers = Object.values(keysDict);
  const rows = events.map((event) =>
    Object.keys(keysDict).map((key) =>
      String(event[key as keyof SimulatedEvent])
    )
  );

  return [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
}
