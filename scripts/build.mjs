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

await Promise.all([
  esbuild.build({
    ...shared,
    entryPoints: ["src/background/index.js"],
    outfile: "dist/background.js",
    format: "esm"
  }),
  esbuild.build({
    ...shared,
    entryPoints: ["src/content/index.js"],
    outfile: "dist/content.js",
    format: "iife"
  }),
  esbuild.build({
    ...shared,
    entryPoints: ["src/page/index.js"],
    outfile: "dist/page.js",
    format: "iife"
  }),
  esbuild.build({
    ...shared,
    entryPoints: ["src/popup/popup.js"],
    outfile: "dist/popup/popup.js",
    format: "iife"
  })
]);

console.log("Build concluído: dist/");
