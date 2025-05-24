import { client as akismetClient } from "../src/index";
import { config as dotenvConfig } from "dotenv";
import { describe, it, expect } from "vitest";

describe("Akismet", () => {
  dotenvConfig();
  const apiKey = "70542d86693e";
  const blog = "https://stblog.penclub.club";

  if (!apiKey || !blog) {
    throw new Error("Please enter your Akismet API key and blog URL.");
  }

  const client = akismetClient({ apiKey, blog, port: 443 });
  const invalidKeyClient = akismetClient({ blog, apiKey: "invalid-key" });
  const invalidHostClient = akismetClient({ apiKey, blog, host: "1.1.1.1" });

  const spamObject = {
    comment_author: "viagra-test-123",
    comment_content: "spam!",
    is_test: 1,
    user_ip: "192.168.0.1",
  };

  const hamObject = {
    comment_author: "A. Thor",
    comment_content: "Hello, this is normal text",
    is_test: 1,
    user_ip: "192.168.0.1",
    user_role: "Administrator",
  };

  describe("Verify key", () => {
    it("should return true if the key is valid", () =>
      new Promise<void>((resolve) => {
        client.verifyKey((err, verified) => {
          expect(err).toBe(null);
          expect(verified).toBe(true);
          resolve();
        });
      }));

    it("should return false if the key is invalid", () =>
      new Promise<void>((done) => {
        invalidKeyClient.verifyKey((err, verified) => {
          expect(err).toBeNull();
          expect(verified).toBeFalsy();
          done();
        });
      }));

    it("should generate an error if the host is not available", () =>
      new Promise<void>((done) => {
        invalidHostClient.verifyKey((err, verified) => {
          expect(err).toBeTruthy();
          done();
        });
      }));
  });

  describe("Check comment", () => {
    it("should return true if the text is spam", () =>
      new Promise<void>((done) => {
        client.checkComment(spamObject, (err, spam) => {
          expect(err).toBeNull();
          expect(spam).toBeTruthy();
          done();
        });
      }));

    it("should return false if the text is not spam", () =>
      new Promise<void>((done) => {
        client.checkComment(hamObject, (err, spam) => {
          expect(err).toBeNull();
          expect(spam).toBeFalsy();
          done();
        });
      }));

    it("should generate an error if the host is not available", () =>
      new Promise<void>((done) => {
        invalidHostClient.checkComment(spamObject, (err, spam) => {
          expect(err).toBeTruthy();
          done();
        });
      }));
  });
});
