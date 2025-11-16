import jwt from '@node-rs/jsonwebtoken';
import type { Middleware } from 'koa';
import fs from 'node:fs/promises'


let bannedUids: string[] = [];

try {
  const data = await fs.readFile('./data/banned-uids.json', 'utf-8');
  bannedUids = JSON.parse(data);
} catch (error) {
  console.error('Failed to load banned UIDs:', error);
  console.error('Proceeding with an empty banned UIDs list.');
}

if (!process.env.JWT_TOKEN)
  throw new Error(
    'JWT_TOKEN is not set in environment variables. Please set it to use the UID plugin.',
  );

const jwtToken = process.env.JWT_TOKEN;

const addCookie: Middleware = async (ctx, next) => {
  if (ctx.path !== '/api/comment' || ctx.method.toUpperCase() !== 'POST')
    return next();
  let uid: string | undefined;
  const uidCookie = ctx.cookies.get('uid');
  if (uidCookie) {
    try {
      uid = (await jwt.verify(uidCookie, jwtToken)).uid;
    } catch (e) {
      think.logger.error(`Invalid UID token: ${e}`);
    }
  }
  if (!uid) {
    const newUid = crypto.randomUUID();
    const exp = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
    const token = await jwt.sign({ uid: newUid, exp }, jwtToken);
    uid = newUid;
    ctx.cookies.set('uid', token, {
      sameSite: 'strict',
      path: '/api/comment',
      expires: new Date(exp),
    });
  }
  if (bannedUids.includes(uid)) {
    ctx.status = 403;
    ctx.body = { errno: 403, errmsg: 'Your UID is banned from commenting.' };
    think.logger.warn(`Banned UID attempted to comment: ${uid}`);
    return;
  }
  think.logger.info(`New comment from UID: ${uid}`);
  await next();
};

export default { middlewares: [addCookie] };
