import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { programOutcomes } from "@/lib/programOutcomes";

// Temporary S5 spike: delete this page at F5.
async function SpikeResult() {
  await connection(); // request time only, so the build never touches the database or the clock

  // DB query: one program with all of its reports.
  const program = await prisma.program.findUnique({
    where: { id: "prog-gold-coast-solar" },
    include: { reports: true },
  });
  if (!program) return <p>Program not found.</p>;

  // The server computes every number; the page only prints it.
  const summary = programOutcomes(
    program.reports.map((r) => ({
      status: r.status,
      jobWithin90Days: r.jobWithin90Days,
      exitDate: r.exitDate,
      verification: r.verification,
      isSample: r.isSample,
    })),
    new Date(),
  );

  return (
    <>
      <h1>{program.name}</h1>
      <p>
        {summary.hidden
          ? "Not enough reports yet"
          : `${summary.jobCount} of ${summary.knownCount} reported a job within 90 days of leaving`}
      </p>
      <p>Sample data, not real opportunities.</p>
    </>
  );
}

export default function SpikePage() {
  return (
    <main>
      <Suspense fallback={<p>Loading…</p>}>
        <SpikeResult />
      </Suspense>
    </main>
  );
}
