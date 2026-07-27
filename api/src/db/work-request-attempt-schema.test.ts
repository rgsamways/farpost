import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_REQUESTER_ID = `test-requester-${randomUUID()}`;
const TEST_CANDIDATE_ID = `test-candidate-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.job).where(eq(schema.job.requesterUserId, TEST_REQUESTER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_REQUESTER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_CANDIDATE_ID));
}

async function insertTestJobAndCandidate() {
  await db
    .insert(schema.user)
    .values({ id: TEST_REQUESTER_ID, name: "Test Requester", email: `${TEST_REQUESTER_ID}@example.com` });
  await db
    .insert(schema.user)
    .values({ id: TEST_CANDIDATE_ID, name: "Test Candidate", email: `${TEST_CANDIDATE_ID}@example.com` });
  const [job] = await db
    .insert(schema.job)
    .values({
      requesterUserId: TEST_REQUESTER_ID,
      targetRole: "contractor",
      subjectType: "building",
      subjectId: randomUUID(),
      description: "Fix the roof",
    })
    .returning();
  return job;
}

function futureTimeoutAt() {
  return new Date(Date.now() + 30 * 60 * 1000);
}

describe("work_request_attempt", () => {
  afterEach(cleanup);

  it("allows multiple attempts per job with increasing attempt_number", async () => {
    const job = await insertTestJobAndCandidate();
    await db.insert(schema.workRequestAttempt).values([
      { jobId: job.id, candidateUserId: TEST_CANDIDATE_ID, attemptNumber: 1, timeoutAt: futureTimeoutAt() },
      { jobId: job.id, candidateUserId: TEST_CANDIDATE_ID, attemptNumber: 2, timeoutAt: futureTimeoutAt() },
    ]);

    const rows = await db
      .select()
      .from(schema.workRequestAttempt)
      .where(eq(schema.workRequestAttempt.jobId, job.id));
    expect(rows.map((r) => r.attemptNumber).sort()).toEqual([1, 2]);
  });

  it("starts with a null response and responded_at", async () => {
    const job = await insertTestJobAndCandidate();
    const [row] = await db
      .insert(schema.workRequestAttempt)
      .values({ jobId: job.id, candidateUserId: TEST_CANDIDATE_ID, attemptNumber: 1, timeoutAt: futureTimeoutAt() })
      .returning();

    expect(row.response).toBeNull();
    expect(row.respondedAt).toBeNull();
  });

  it("rejects an invalid response value", async () => {
    const job = await insertTestJobAndCandidate();
    await expect(
      db.insert(schema.workRequestAttempt).values({
        jobId: job.id,
        candidateUserId: TEST_CANDIDATE_ID,
        attemptNumber: 1,
        timeoutAt: futureTimeoutAt(),
        response: "bogus" as any,
      }),
    ).rejects.toThrow();
  });

  it("persists decline_reason alongside a declined response", async () => {
    const job = await insertTestJobAndCandidate();
    const [row] = await db
      .insert(schema.workRequestAttempt)
      .values({ jobId: job.id, candidateUserId: TEST_CANDIDATE_ID, attemptNumber: 1, timeoutAt: futureTimeoutAt() })
      .returning();

    const [updated] = await db
      .update(schema.workRequestAttempt)
      .set({ response: "declined", respondedAt: new Date(), declineReason: "Too far away" })
      .where(eq(schema.workRequestAttempt.id, row.id))
      .returning();

    expect(updated.response).toBe("declined");
    expect(updated.declineReason).toBe("Too far away");
  });

  it("is deleted when its Job is deleted", async () => {
    const job = await insertTestJobAndCandidate();
    await db.insert(schema.workRequestAttempt).values({
      jobId: job.id,
      candidateUserId: TEST_CANDIDATE_ID,
      attemptNumber: 1,
      timeoutAt: futureTimeoutAt(),
    });

    await db.delete(schema.job).where(eq(schema.job.id, job.id));

    const rows = await db
      .select()
      .from(schema.workRequestAttempt)
      .where(eq(schema.workRequestAttempt.jobId, job.id));
    expect(rows).toHaveLength(0);
  });
});
