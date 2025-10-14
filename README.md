# Waline Docker Slim

A slim and modern waline server image with SQLite.

The optimization is highly opinionated, and it may not suit all use cases. If you need more features, consider [using the full waline image](https://waline.js.org/guide/deploy/vps.html#docker-%E9%83%A8%E7%BD%B2).

## Usage

Download the `compose.yaml` file, create a `data` folder beside it. Then create a `banned-uids.json` file inside the `data` folder with content `[]`. Don't forget to download [waline's SQLite db file](https://github.com/walinejs/waline/blob/main/assets/waline.sqlite) and put it in the `data` folder.

If you are not me, you will not need my anti-stalker API. So you should remove the `CLASS_IT_UP_API` environment variable in the `compose.yaml` file.

Finally, run:

```bash
docker-compose up -d
```

## Removed and rewritten Dependencies

Unnecessary dependencies are removed to reduce the image size. The number of dependencies is reduced from 540 to 351, and the size of node_modules is reduced from 180.4MB to 98.74MB.

### Storage

Since we use SQLite, we don't need the `leancloud-storage`, `@cloudbase/node-sdk`, `deta`, `think-model-postgresql`, `think-model-mysql`, `think-model-mysql2` and `think-mongo` dependency. This reduces the image size significantly.

### Network

As we use Node v24, we don't need `node-fetch`. `akismet` uses `request`, which is deprecated. `node-fetch` and `request` are removed, and `akismet` is rewritten at `packages/akismet-js` to remove the `request` dependency.

### Other

I also used [nolyfill](https://github.com/sukkaw/nolyfill) to remove unnecessary polyfills.

Use KaTeX instead of MathJax for rendering math formulas. MathJax is large and slow, and KaTeX is a good alternative in lightweight use cases (such as my blog comment area). This reduces the node_modules size of 40MB.

You should add these css to your frontend to make math formulas be rendered correctly in Firefox due to its [behavior](https://developer.mozilla.org/en-US/docs/Web/MathML/Reference/Element/semantics) of handling MathML tags:

```css
span.katex math {
  font-size: 0;
}

span.katex math > * {
  font-size: 1rem; /* or any other size you want */
}
```
