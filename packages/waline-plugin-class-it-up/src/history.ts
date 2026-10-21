import {
  appendFile,
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

interface Message {
  content: string;
  timestamp: number;
}

type History = Record<string, Message[]>;

interface RequestLog {
  content: string;
  uaHash: string;
  requestedAt: string;
  predictedLabel: 0 | 1 | null;
}

interface HistoryStore {
  recordMessage(uaHash: string, content: string): Promise<string>;
  recordRequest(request: RequestLog): Promise<void>;
}

// One instance per process: serialize read/modify/write across all UA hashes.
export const createHistoryStore = (directory: string): HistoryStore => {
  let pending: Promise<unknown> = Promise.resolve();
  const historyPath = join(directory, 'class-it-up-history.json');
  const logPath = join(directory, 'class-it-up-requests.ldjson');

  const recordMessage = (uaHash: string, content: string): Promise<string> => {
    const operation = pending.then(async () => {
      await mkdir(directory, { recursive: true });
      let history: History = Object.create(null);
      try {
        const parsed: unknown = JSON.parse(await readFile(historyPath, 'utf8'));
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed) ||
          !Object.values(parsed).every(
            (messages) =>
              Array.isArray(messages) &&
              messages.every(
                (message) =>
                  message &&
                  typeof message.content === 'string' &&
                  typeof message.timestamp === 'number' &&
                  Number.isFinite(message.timestamp),
              ),
          )
        ) {
          throw new Error('Invalid Class It Up history');
        }
        history = Object.assign(Object.create(null), parsed);
      } catch (error) {
        // Never overwrite corrupted or unreadable history with an empty store.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }

      const now = Date.now();
      for (const [hash, messages] of Object.entries(history)) {
        history[hash] = messages.filter(
          (message) => message.timestamp > now - DAY_MS,
        );
        if (history[hash].length === 0) delete history[hash];
      }
      history[uaHash] ??= [];
      const messages = history[uaHash];
      messages.push({ content, timestamp: now });
      const combined = messages.map((message) => message.content).join('\n');

      const temporaryPath = `${historyPath}.tmp`;
      await writeFile(temporaryPath, JSON.stringify(history), 'utf8');
      await rename(temporaryPath, historyPath);
      return combined;
    });
    // A failed write must not permanently poison the queue.
    pending = operation.catch(() => {});
    return operation;
  };

  const recordRequest = (request: RequestLog): Promise<void> => {
    const operation = pending.then(() =>
      appendFile(logPath, `${JSON.stringify(request)}\n`, 'utf8'),
    );
    pending = operation.catch(() => {});
    return operation;
  };

  return { recordMessage, recordRequest };
};
