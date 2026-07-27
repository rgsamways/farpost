import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { db, schema } from "./client.js";

const TEST_EVENT_TYPE = `TEST.EVENT.${randomUUID()}`;
const TEST_USER_1 = `test-recipient-1-${randomUUID()}`;
const TEST_USER_2 = `test-recipient-2-${randomUUID()}`;
const TEST_USER_3 = `test-recipient-3-${randomUUID()}`;

async function cleanup() {
  await db.delete(schema.event).where(eq(schema.event.eventType, TEST_EVENT_TYPE));
  for (const id of [TEST_USER_1, TEST_USER_2, TEST_USER_3]) {
    await db.delete(schema.user).where(eq(schema.user.id, id));
  }
}

async function insertTestEventAndUsers() {
  for (const id of [TEST_USER_1, TEST_USER_2, TEST_USER_3]) {
    await db.insert(schema.user).values({ id, name: "Test Recipient", email: `${id}@example.com` });
  }
  const [eventRow] = await db
    .insert(schema.event)
    .values({ eventType: TEST_EVENT_TYPE, subjectType: "job", subjectId: randomUUID() })
    .returning();
  return eventRow;
}

describe("event_recipient", () => {
  afterEach(cleanup);

  it("allows an event to fan out to multiple recipients", async () => {
    const eventRow = await insertTestEventAndUsers();
    await db.insert(schema.eventRecipient).values([
      { eventId: eventRow.id, recipientUserId: TEST_USER_1 },
      { eventId: eventRow.id, recipientUserId: TEST_USER_2 },
      { eventId: eventRow.id, recipientUserId: TEST_USER_3 },
    ]);

    const rows = await db
      .select()
      .from(schema.eventRecipient)
      .where(eq(schema.eventRecipient.eventId, eventRow.id));
    expect(rows).toHaveLength(3);
  });

  it("starts unread", async () => {
    const eventRow = await insertTestEventAndUsers();
    const [row] = await db
      .insert(schema.eventRecipient)
      .values({ eventId: eventRow.id, recipientUserId: TEST_USER_1 })
      .returning();
    expect(row.readAt).toBeNull();
  });

  it("tracks read state per-recipient, not globally", async () => {
    const eventRow = await insertTestEventAndUsers();
    const [read, unread] = await db
      .insert(schema.eventRecipient)
      .values([
        { eventId: eventRow.id, recipientUserId: TEST_USER_1, readAt: new Date() },
        { eventId: eventRow.id, recipientUserId: TEST_USER_2 },
      ])
      .returning();

    expect(read.readAt).not.toBeNull();
    expect(unread.readAt).toBeNull();
  });

  it("is deleted when its Event is deleted", async () => {
    const eventRow = await insertTestEventAndUsers();
    await db.insert(schema.eventRecipient).values({ eventId: eventRow.id, recipientUserId: TEST_USER_1 });

    await db.delete(schema.event).where(eq(schema.event.id, eventRow.id));

    const rows = await db
      .select()
      .from(schema.eventRecipient)
      .where(eq(schema.eventRecipient.eventId, eventRow.id));
    expect(rows).toHaveLength(0);
  });
});
