import { Application, Router } from "oak";
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

  const scriptId = btoa(`${repoOwner}:${repoName}:${filePath}`);

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
        <pre>
            <code>
            &lt;div id="markdown-container"&gt;&lt;/div&gt;
            &lt;script type="module" src="${context.request.url.origin}/embed-script/${scriptId}"&gt;&lt;/script&gt;
            </code>
        </pre>
        <div id="markdown-container"></div>
        <script type="module" src="/embed-script/${scriptId}"></script>
    </body>
    </html>
  `;
});

router.get("/embed-script/:scriptId", async (context) => {
  const scriptId = context.params.scriptId!;

  if (!scriptId) {
    context.throw(400, "Script ID is required");
    return;
  }

  const [repoOwner, repoName, filePath] = atob(scriptId).split(":");

  try {
    const bundledMarkdownModule = await bundleModule(
      new URL("./markdown.ts", import.meta.url).href
    );

    context.response.headers.set("Access-Control-Allow-Origin", "*");
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

// CORS middleware
app.use(async (context, next) => {
  context.response.headers.set("Access-Control-Allow-Origin", "*");
  context.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );
  context.response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (context.request.method === "OPTIONS") {
    context.response.status = 204;
  } else {
    await next();
  }
});

const port = 8000;
console.log(`Server listening on port ${port}`);
await app.listen({ port });
