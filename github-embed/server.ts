import { Application, Router } from "oak";
import "./markdown.esm.js";
const app = new Application();
const router = new Router();

const head = `
<head>
<meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Embedder</title>
<link rel="stylesheet" href="https://the.missing.style"> 
<link rel="stylesheet" href="https://missing.style/missing-prism.css"> 
</head>
`;

// Serve the landing page with the form
router.get("/", (context) => {
  context.response.body = `
    <!DOCTYPE html>
    <html lang="en">
    ${head}
    <body>
    <main>
        <h1>Embed Markdown from GitHub</h1>
        <form action="/embed" method="post" class="grid">
            <label for="github-url">GitHub URL:
            
            <input class="width:100%" type="text" id="github-url" name="github-url" required>
            <button type="submit">Submit</button>
            </label>
        </form>
        </main>
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
    
    ${head}
    <body>
    <main>
        <h1>Embed this script on your webpage</h1>
        <pre><code>
&lt;div id="markdown-container"&gt;&lt;/div&gt;
&lt;script type="module" src="${context.request.url.origin}/embed-script/${scriptId}"&gt;&lt;/script&gt;
</code>
        </pre>
        <div id="markdown-container" class="box"></div>
        <script type="module" src="/embed-script/${scriptId}"></script>
        </main>
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
    context.response.headers.set("Access-Control-Allow-Origin", "*");
    context.response.headers.set("Content-Type", "application/javascript");
    context.response.body = `
        ${await Deno.readTextFile(
          "https://gist.githubusercontent.com/jonathanhudak/c832fb67ddb408e627c7d73d9b14a072/raw/a56c42d2b463640dbe36968157f40c55bf054c5a/embed-markdown.js"
        )}
  
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
