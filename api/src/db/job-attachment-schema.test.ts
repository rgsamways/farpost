import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_REQUESTER_ID = `test-requester-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.job).where(eq(schema.job.requesterUserId, TEST_REQUESTER_ID));
  await db.delete(schema.user).where(eq(schema.user.id, TEST_REQUESTER_ID));
}

async function insertTestJob() {
  await db
    .insert(schema.user)
    .values({ id: TEST_REQUESTER_ID, name: "Test Requester", email: `${TEST_REQUESTER_ID}@example.com` });
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

describe("job_attachment", () => {
  afterEach(cleanup);

  it("allows multiple attachments per job", async () => {
    const job = await insertTestJob();
    await db.insert(schema.jobAttachment).values([
      { jobId: job.id, docType: "photo", url: "https://example.com/1.jpg", uploadedByUserId: TEST_REQUESTER_ID },
      { jobId: job.id, docType: "photo", url: "https://example.com/2.jpg", uploadedByUserId: TEST_REQUESTER_ID },
      { jobId: job.id, docType: "report", url: "https://example.com/3.pdf", uploadedByUserId: TEST_REQUESTER_ID },
    ]);

    const rows = await db
      .select()
      .from(schema.jobAttachment)
      .where(eq(schema.jobAttachment.jobId, job.id));
    expect(rows).toHaveLength(3);
  });

  it("is deleted when its Job is deleted", async () => {
    const job = await insertTestJob();
    await db.insert(schema.jobAttachment).values({
      jobId: job.id,
      docType: "photo",
      url: "https://example.com/1.jpg",
      uploadedByUserId: TEST_REQUESTER_ID,
    });

    await db.delete(schema.job).where(eq(schema.job.id, job.id));

    const rows = await db
      .select()
      .from(schema.jobAttachment)
      .where(eq(schema.jobAttachment.jobId, job.id));
    expect(rows).toHaveLength(0);
  });
});
