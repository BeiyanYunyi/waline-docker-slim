# Waline Docker Slim

A slim and modern waline server image with SQLite.

The optimization is highly opinionated, and it may not suit all use cases. If you need more features, consider [using the full waline image](https://waline.js.org/guide/deploy/vps.html#docker-%E9%83%A8%E7%BD%B2).

|                         | **waline-docker-slim** (this image) | lizheming/waline (official image) |
| :---------------------: | :---------------------------------: | :-------------------------------: |
|     Image Size[^1]      |             **~160MB**              |              ~360MB               |
|    Dependencies[^2]     |               **252**               |                540                |
| `node_modules` Size[^2] |              **~64MB**              |              ~180MB               |

## Usage

Download the `compose.yaml` file, create a `data` folder beside it. Then create a `banned-uids.json` file inside the `data` folder with content `[]`. Don't forget to download [waline's SQLite db file](https://github.com/walinejs/waline/blob/main/assets/waline.sqlite) and put it in the `data` folder.

If you are not me, you will not need my anti-stalker API (as it's highly fine-tuned for [filtering out Wang Kuangyi's content](https://stblog.penclub.club/posts/FilterStalking/)). So you should remove the `CLASS_IT_UP_API` environment variable in the `compose.yaml` file.

Finally, run:

```bash
docker-compose up -d
```

## Optimizations

### Alternative Runtime

This image uses [Bun](https://bun.sh/) instead of Node.js. Bun is a modern JavaScript runtime that is faster and more efficient than Node.js. It also has a built-in package manager and SQLite, which reduces the number of dependencies needed.

### Removed and rewritten Dependencies

Unnecessary dependencies are removed to reduce the image size. Old dependencies are rewritten to use modern alternatives or Bun's built-in features.

#### Storage

Since we use SQLite, we don't need the `leancloud-storage`, `@cloudbase/node-sdk`, `deta`, `think-model-postgresql`, `think-model-mysql`, `think-model-mysql2` and `think-mongo` dependency. This reduces the image size significantly.

The `think-model-sqlite` package is rewritten at `packages/think-model-bun-sqlite` to use Bun's built-in SQLite support, removing the need for the `sqlite3` and `generic-pool` dependencies.

#### Network

As we use Bun 1.3.0, we don't need `node-fetch`. `akismet` uses `request`, which is deprecated. `node-fetch` and `request` are removed, and `akismet` is rewritten at `packages/akismet-js` to remove the `request` dependency.

#### Other

I also used [nolyfill](https://github.com/sukkaw/nolyfill) to remove unnecessary polyfills.

Use KaTeX instead of MathJax for rendering math formulas. MathJax is large and slow, and KaTeX is a good alternative in lightweight use cases (such as my blog comment area). This reduces the node_modules size of 40MB.

You should add these css to your frontend code to make math formulas be rendered correctly in Firefox due to its [behavior](https://developer.mozilla.org/en-US/docs/Web/MathML/Reference/Element/semantics) of handling MathML tags, until [walinejs/waline#3238](https://github.com/walinejs/waline/issues/3238) was solved:

```css
span.katex math {
  font-size: 0;
}

span.katex math > * {
  font-size: 1rem; /* or any other size you want */
}
```

[^1]: Unpacked size of the image. After pulling `ghcr.io/beiyanyunyi/waline-docker-slim:edge` and `lizheming/waline:alpine`, run `docker image ls` and check the `SIZE` field.
[^2]: Production dependencies only.
