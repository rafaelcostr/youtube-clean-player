import { cpSync, copyFileSync, mkdirSync } from "node:fs";
import * as esbuild from "esbuild";

mkdirSync("dist/popup", { recursive: true });

copyFileSync("src/player.js", "dist/player.js");
cpSync("src/popup/popup.html", "dist/popup/popup.html");
cpSync("src/popup/popup.css", "dist/popup/popup.css");

await esbuild.build({
  bundle: true,
  platform: "browser",
  target: "chrome109",
  entryPoints: ["src/content.js"],
  outfile: "dist/content.js",
  format: "iife",
  logLevel: "info"
});

await esbuild.build({
  bundle: true,
  platform: "browser",
  target: "chrome109",
  entryPoints: ["src/popup/popup.js"],
  outfile: "dist/popup/popup.js",
  format: "iife",
  logLevel: "info"
});

console.log("Build concluído: dist/");
