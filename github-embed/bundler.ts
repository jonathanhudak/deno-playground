import { bundle } from "https://deno.land/x/emit/mod.ts";
export async function bundleModule(entryPoint: string): Promise<string> {
  const url = new URL(entryPoint);
  const result = await bundle(url);

  return result.code;
}
