import { client as akismetClient } from '../src/index';
import { config as dotenvConfig } from 'dotenv';
import { describe, it, expect } from 'vitest';

describe('Akismet', () => {
  dotenvConfig();
  const apiKey = '70542d86693e';
  const blog = 'https://stblog.penclub.club';

  if (!apiKey || !blog) {
    throw new Error('Please enter your Akismet API key and blog URL.');
  }

  const client = akismetClient({ apiKey, blog, port: 443 });
  const invalidKeyClient = akismetClient({ blog, apiKey: 'invalid-key' });
  const invalidHostClient = akismetClient({ apiKey, blog, host: '1.1.1.1' });

  const spamObject = {
    comment_author: 'viagra-test-123',
    comment_content: 'spam!',
    is_test: 1,
    user_ip: '192.168.0.1',
  };

  const hamObject = {
    comment_author: 'A. Thor',
    comment_content: 'Hello, this is normal text',
    is_test: 1,
    user_ip: '192.168.0.1',
    user_role: 'Administrator',
  };

  describe('Verify key', () => {
    it('should return true if the key is valid', async () => {
      const { err, isValid } = await client.verifyKey();
      expect(err).toBe(null);
      expect(isValid).toBe(true);
    });

    it('should return false if the key is invalid', async () => {
      const { err, isValid } = await invalidKeyClient.verifyKey();
      expect(err).toBeNull();
      expect(isValid).toBeFalsy();
    });

    it('should generate an error if the host is not available', async () => {
      const { err } = await invalidHostClient.verifyKey();
      expect(err).toBeTruthy();
    });
  });

  describe('Check comment', () => {
    it('should return true if the text is spam', async () => {
      const { err, isSpam } = await client.checkComment(spamObject);
      expect(err).toBeNull();
      expect(isSpam).toBeTruthy();
    });

    it('should return false if the text is not spam', async () => {
      const { err, isSpam } = await client.checkComment(hamObject);
      expect(err).toBeNull();
      expect(isSpam).toBeFalsy();
    });

    it('should generate an error if the host is not available', async () => {
      const { err } = await invalidHostClient.checkComment(spamObject);
      expect(err).toBeTruthy();
    });
  });
});
