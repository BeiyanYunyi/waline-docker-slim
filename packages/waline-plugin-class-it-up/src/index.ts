import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createHistoryStore } from './history.ts';

interface ICommentRecord {
  lastReportTime: Date;
  banTimeMultiplier: number;
}

interface IComment {
  link: string;
  mail: string;
  nick: string;
  ua: string;
  url: string;
  comment: string;
  ip: string;
  insertedAt: Date;
  user_id: undefined;
  status: 'approved' | 'waiting' | 'spam';
}

const hashIpAndUA = (_ip: string, ua: string): string => {
  const sha256 = createHash('sha256');
  // sha256.update(ip);
  sha256.update(ua);
  return sha256.digest('base64url');
};

const bannedUserMap: Map<string, ICommentRecord> = new Map();
const banPath = './data/class-it-up-bans.json';
const maxBanMinutes = 1024;
let bansLoaded: Promise<void> | undefined;
let banWrite: Promise<unknown> = Promise.resolve();

const loadBans = (): Promise<void> => {
  bansLoaded ??= (async () => {
    let raw: string;
    try {
      raw = await readFile(banPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
    const records: unknown = JSON.parse(raw);
    if (!records || typeof records !== 'object' || Array.isArray(records)) {
      throw new Error('Invalid Class It Up bans');
    }
    const loaded = new Map<string, ICommentRecord>();
    for (const [hash, record] of Object.entries(records)) {
      if (
        !record ||
        typeof record.lastReportTime !== 'string' ||
        !Number.isFinite(Date.parse(record.lastReportTime)) ||
        !Number.isSafeInteger(record.banTimeMultiplier) ||
        record.banTimeMultiplier < 1
      ) {
        throw new Error('Invalid Class It Up ban record');
      }
      loaded.set(hash, {
        lastReportTime: new Date(record.lastReportTime),
        banTimeMultiplier: Math.min(record.banTimeMultiplier, maxBanMinutes),
      });
    }
    for (const [hash, record] of loaded) bannedUserMap.set(hash, record);
  })().catch((error) => {
    bansLoaded = undefined;
    throw error;
  });
  return bansLoaded;
};

const createIpUaFilter = (map: Map<string, ICommentRecord>) => {
  const getBanUntil = (record: ICommentRecord): Date =>
    new Date(
      record.lastReportTime.getTime() + 60_000 * record.banTimeMultiplier,
    );

  const checkBanned = async (comment: IComment): Promise<boolean> => {
    await loadBans();
    const userHash = hashIpAndUA(comment.ip, comment.ua);
    const record = map.get(userHash);
    if (!record) return false;

    const now = new Date();
    if (now < getBanUntil(record)) {
      comment.status = 'waiting';
      return true;
    }
    return false;
  };

  const recordViolation = async (comment: IComment): Promise<void> => {
    const userHash = hashIpAndUA(comment.ip, comment.ua);
    const now = new Date();
    const record = map.get(userHash);
    if (record) {
      record.lastReportTime = now;
      record.banTimeMultiplier = Math.min(
        record.banTimeMultiplier * 2,
        maxBanMinutes,
      );
    } else {
      map.set(userHash, {
        lastReportTime: now,
        banTimeMultiplier: 1,
      });
    }
    const operation = banWrite.then(async () => {
      await mkdir('./data', { recursive: true });
      await writeFile(
        `${banPath}.tmp`,
        JSON.stringify(Object.fromEntries(map)),
        'utf8',
      );
      await rename(`${banPath}.tmp`, banPath);
    });
    banWrite = operation.catch(() => {});
    await operation;
  };

  return { checkBanned, recordViolation };
};

const ipUaFilter = createIpUaFilter(bannedUserMap);

const apiAddress = process.env.CLASS_IT_UP_API;
const { recordMessage, recordRequest } = createHistoryStore('./data');

const preSave = async (comment: IComment): Promise<void> => {
  if (!apiAddress) return;

  if (await ipUaFilter.checkBanned(comment)) return;

  const uaHash = hashIpAndUA(comment.ip, comment.ua);
  const content = await recordMessage(uaHash, comment.comment);
  const requestedAt = new Date().toISOString();
  let predictedLabel: 0 | 1 | null = null;
  try {
    const res: { predicted_label: 0 | 1 } = await fetch(apiAddress, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }).then((res) => res.json());
    predictedLabel = res.predicted_label ?? null;
  } finally {
    await recordRequest({ content, uaHash, requestedAt, predictedLabel });
  }
  if (predictedLabel === 1) {
    think.logger.warn('Stalking detected');
    comment.status = 'waiting';
    await ipUaFilter.recordViolation(comment);
  }
};

const walinePluginClassItUp: () => { hooks: { preSave: typeof preSave } } =
  () => ({
    hooks: {
      preSave,
    },
  });

export default walinePluginClassItUp;
