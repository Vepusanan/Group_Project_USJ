import test from "node:test";
import assert from "node:assert/strict";
import { assertAllowedMessageAttachmentUrl } from "../utils/messageAttachmentUrl.js";

const SAMPLE_URL =
  "https://abc123.supabase.co/storage/v1/object/public/message-attachments/messages/user-1_1234567890_abc123.pdf";

test("assertAllowedMessageAttachmentUrl accepts sender-owned uploads", () => {
  assert.doesNotThrow(() =>
    assertAllowedMessageAttachmentUrl(SAMPLE_URL, "user-1"),
  );
});

test("assertAllowedMessageAttachmentUrl rejects foreign attachment paths", () => {
  assert.throws(
    () => assertAllowedMessageAttachmentUrl(SAMPLE_URL, "user-2"),
    (error) => error.statusCode === 403,
  );
});

test("assertAllowedMessageAttachmentUrl rejects non-platform hosts", () => {
  assert.throws(
    () =>
      assertAllowedMessageAttachmentUrl(
        "https://evil.example.com/file.pdf",
        "user-1",
      ),
    (error) => error.statusCode === 400,
  );
});
