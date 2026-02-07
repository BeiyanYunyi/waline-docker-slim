import { createHash } from 'node:crypto';

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

const hashIpAndUA = (ip: string, ua: string): string => {
  const sha256 = createHash('sha256');
  // sha256.update(ip);
  sha256.update(ua);
  return sha256.digest('base64url');
};

const bannedUserMap: Map<string, ICommentRecord> = new Map();

const createIpUaFilter = (map: Map<string, ICommentRecord>) => {
  const getBanUntil = (record: ICommentRecord): Date =>
    new Date(
      record.lastReportTime.getTime() + 60_000 * record.banTimeMultiplier,
    );

  const checkBanned = (comment: IComment): void => {
    const userHash = hashIpAndUA(comment.ip, comment.ua);
    const record = map.get(userHash);
    if (!record) return;

    const now = new Date();
    if (now < getBanUntil(record)) {
      comment.status = 'waiting';
      throw new Error(
        `You are temporarily banned for ${Math.ceil((getBanUntil(record).getTime() - now.getTime()) / 60000)} minutes, please try again later.`,
      );
    }
  };

  const recordViolation = (comment: IComment): void => {
    const userHash = hashIpAndUA(comment.ip, comment.ua);
    const now = new Date();
    const record = map.get(userHash);
    if (record) {
      record.lastReportTime = now;
      record.banTimeMultiplier *= 2;
      return;
    }

    map.set(userHash, {
      lastReportTime: now,
      banTimeMultiplier: 1,
    });
  };

  return { checkBanned, recordViolation };
};

const ipUaFilter = createIpUaFilter(bannedUserMap);

const apiAddress = process.env.CLASS_IT_UP_API;

const preSave = async (comment: IComment): Promise<void> => {
  if (!apiAddress) return;

  ipUaFilter.checkBanned(comment);

  const res: { predicted_label: 0 | 1 } = await fetch(apiAddress, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: comment.comment }),
  }).then((res) => res.json());
  if (res.predicted_label === 1) {
    think.logger.warn('Stalking detected');
    comment.status = 'waiting';
    ipUaFilter.recordViolation(comment);
    throw new Error(
      'Stalking-like comment detected, please rearrange your comment.',
    );
  }
};

const walinePluginClassItUp: () => { hooks: { preSave: typeof preSave } } =
  () => ({
    hooks: {
      preSave,
    },
  });

export default walinePluginClassItUp;
