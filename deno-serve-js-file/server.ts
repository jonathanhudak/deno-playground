import { Application, Router } from "https://deno.land/x/oak/mod.ts";
const app = new Application();
const router = new Router();
router.get("/", async (context) => {
  try {
    context.response.headers.set("Access-Control-Allow-Origin", "*");
    context.response.headers.set("Content-Type", "application/javascript");
    context.response.body = `
        ${await Deno.readTextFile("./index.js")}
      `;
  } catch (error) {
    context.throw(500, `Error generating script: ${error.message}`);
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(`Server listening on port ${port}`);
await app.listen({ port });
