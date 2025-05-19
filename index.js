import { createRequire } from "node:module";
import path from "node:path";
import Application from "thinkjs";

const require = createRequire(import.meta.url);

const ROOT_PATH = path.resolve(require.resolve("@waline/vercel"), "..");

const instance = new Application({
  ROOT_PATH,
  APP_PATH: path.resolve(ROOT_PATH, "src"),
  proxy: true, // use proxy
  env: "production",
});

instance.run();

let config = {};

try {
  const { default: conf } = await import("./config.js");
  config = conf;
} catch {
  // do nothing
}
for (const k in config) {
  think.config(k, config[k]);
}