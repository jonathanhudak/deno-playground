import * as esbuild from "https://deno.land/x/esbuild@v0.17.11/mod.js";
// Import the WASM build on platforms where running subprocesses is not
// permitted, such as Deno Deploy, or when running without `--allow-run`.
// import * as esbuild from "https://deno.land/x/esbuild@v0.17.11/wasm.js";

// import { denoPlugin } from "https://deno.land/x/esbuild_deno_loader@0.6.0/mod.ts";

// https://github.com/lucacasonato/esbuild_deno_loader

const result = await esbuild.build({
  plugins: [],
  entryPoints: ["./markdown.ts"],
  outfile: "./markdown.esm.js",
  bundle: true,
  format: "esm",
});
console.log(result);

esbuild.stop();
