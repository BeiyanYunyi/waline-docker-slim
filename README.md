# Waline Docker Slim

A slim and modern waline server image with SQLite.

The optimization is highly opinionated, and it may not suit all use cases. If you need more features, consider [using the full waline image](https://waline.js.org/guide/deploy/vps.html#docker-%E9%83%A8%E7%BD%B2).

## Removed and rewritten Dependencies

Unnecessary dependencies are removed to reduce the image size. The number of dependencies is reduced from 540 to 351, and the size of node_modules is reduced from 180.4MB to 98.74MB.

### Storage

Since we use SQLite, we don't need the `leancloud-storage`, `@cloudbase/node-sdk`, `deta`, `think-model-postgresql`, `think-model-mysql`, `think-model-mysql2` and `think-mongo` dependency. This reduces the image size significantly.

### Network

As we use Node v22, we don't need `node-fetch`. `akismet` uses `request`, which is deprecated. `node-fetch` and `request` are removed, and `akismet` is rewritten at `packages/akismet-js` to remove the `request` dependency.

### Other

I also used [nolyfill](https://github.com/sukkaw/nolyfill) to remove unnecessary polyfills.
