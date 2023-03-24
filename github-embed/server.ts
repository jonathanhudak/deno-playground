import { Application, Router } from "oak";
import { generate as generateV1 } from "https://deno.land/std@0.181.0/uuid/v1.ts";
import { bundleModule } from "./bundler.ts";
const app = new Application();
const router = new Router();

// Serve the landing page with the form
router.get("/", (context) => {
  context.response.body = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Embedder</title>
    </head>
    <body>
        <h1>Embed Markdown from GitHub</h1>
        <form action="/embed" method="post">
            <label for="github-url">GitHub URL:</label>
            <input type="text" id="github-url" name="github-url" required>
            <button type="submit">Submit</button>
        </form>
    </body>
    </html>
  `;
});

// Handle form submission and generate the JavaScript to embed the Markdown
router.post("/embed", async (context) => {
  const body = await context.request.body({ type: "form" }).value;
  const githubUrl = body.get("github-url");

  if (!githubUrl) {
    context.throw(400, "GitHub URL is required");
    return;
  }

  const [, , , repoOwner, repoName, , ...filePathParts] = githubUrl.split("/");
  const filePath = filePathParts.join("/");

  const scriptId = generateV1();

  context.response.body = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Embed Script</title>
    </head>
    <body>
        <h1>Embed this script on your webpage</h1>
        <pre><code>&lt;script src="${context.request.url.origin}/embed-script/${scriptId}"&gt;&lt;/script&gt;</code></pre>
        <div id="markdown-container"></div>
        <script type="module" src="/embed-script/${scriptId}"></script>
    </body>
    </html>
  `;

  // Store the generated script in memory
  generatedScripts.set(scriptId, {
    repoOwner,
    repoName,
    filePath,
  });
});

// Serve the generated script
const generatedScripts = new Map<
  string,
  { repoOwner: string; repoName: string; filePath: string }
>();

router.get("/embed-script/:scriptId", async (context) => {
  const script = generatedScripts.get(context.params.scriptId!);

  if (!script) {
    context.throw(404, "Script not found");
    return;
  }

  const { repoOwner, repoName, filePath } = script;

  try {
    const bundledMarkdownModule = await bundleModule(
      new URL("./markdown.ts", import.meta.url).href
    );

    context.response.headers.set("Content-Type", "application/javascript");
    context.response.body = `
        ${bundledMarkdownModule}
  
        (async function() {
          const containerId = "markdown-container";
          await embedMarkdownFromGithub("${repoOwner}", "${repoName}", "${filePath}", containerId);
        })();
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
