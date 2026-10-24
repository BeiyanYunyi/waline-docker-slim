# Class It Up comment filter

With `CLASS_IT_UP_API` configured, comments that pass the existing temporary-ban
check are stored by the existing SHA-256/base64url UA hash (IP is not included).
Each classification request sends all messages for that hash from the last
24 hours, including the current message, joined with `\n` in `body.content`.
Messages exactly 24 hours old are excluded. Expired entries for all hashes are
removed on the next request.

Files are created automatically under `./data`, relative to the server's working
directory (the existing Docker volume mounts this as `/app/data`):

- `class-it-up-history.json`: a JSON object mapping UA hashes to arrays of
  `{ "content": "...", "timestamp": 1792454400000 }`; timestamps are Unix
  milliseconds.
- `class-it-up-requests.ldjson`: one JSON object per request with `content`
  (the exact combined API content), `uaHash`, `requestedAt` (UTC ISO time,
  captured immediately before dispatch), and `predictedLabel` (the API's
  `predicted_label`, or `null` if no prediction is received). The entry is
  appended after the request completes or fails. Embedded newlines are
  JSON-escaped.
- `class-it-up-bans.json`: UA hashes mapped to `lastReportTime` (UTC ISO time)
  and `banTimeMultiplier`. The initial ban is one minute; subsequent violations
  double it up to a maximum of 1024 minutes. Loaded records above this limit
  are capped at 1024 minutes as well. Expired records remain so that escalation
  survives restarts.

Comments submitted during a temporary ban or classified with `predictedLabel === 1`
are allowed to submit with status `waiting`, without a moderation error.
Comments submitted during a temporary ban do not enter history or call the API,
and do not extend or escalate the ban.

History survives restarts and retains messages even if classification marks
them as waiting or the API request fails. Temporary bans are restored on the
first enabled hook invocation and saved whenever a violation is recorded.
An unset `CLASS_IT_UP_API` disables the hook and its persistence.

History updates and log appends are serialized within the server process;
JSON is replaced through a temporary file. Run only one server process per data
directory. Corrupt history and storage errors propagate to the hook caller.
Requests interrupted by process termination before the log append may not be
recorded. The log grows independently of the sliding window; rotate it as needed.
