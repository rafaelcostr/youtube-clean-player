import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist/popup", { recursive: true });

cpSync("src/popup/popup.html", "dist/popup/popup.html");
cpSync("src/popup/popup.css", "dist/popup/popup.css");

const shared = {
  bundle: true,
  platform: "browser",
  target: "chrome109",
  logLevel: "info"
};

const builds = [
  {
    ...shared,
    entryPoints: ["src/background/index.js"],
    outfile: "dist/background.js",
    format: "esm"
  },
  {
    ...shared,
    entryPoints: ["src/content/index.js"],
    outfile: "dist/content.js",
    format: "iife"
  },
  {
    ...shared,
    entryPoints: ["src/page/index.js"],
    outfile: "dist/page.js",
    format: "iife"
  },
  {
    ...shared,
    entryPoints: ["src/popup/popup.js"],
    outfile: "dist/popup/popup.js",
    format: "iife"
  }
];

if (process.argv.includes("--watch")) {
  const contexts = await Promise.all(builds.map((options) => esbuild.context(options)));
  await Promise.all(contexts.map((context) => context.watch()));
  console.log("Watch ativo: dist/");
} else {
  await Promise.all(builds.map((options) => esbuild.build(options)));
  console.log("Build concluído: dist/");
}
