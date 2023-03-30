import { Application, Router } from "oak";
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

function githubUrlToScriptId(githubUrl: string) {
  const [, , , repoOwner, repoName, , ...filePathParts] = githubUrl.split("/");
  const filePath = filePathParts.join("/");
  return btoa(`${repoOwner}:${repoName}:${filePath}`);
}

router.post("/embed-id", async (context) => {
  const body = await context.request.body({ type: "json" }).value;
  const { githubUrl } = body || {};

  context.response.body = {
    url: githubUrl,
    scriptId: githubUrlToScriptId(githubUrl),
  };
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

  const scriptId = githubUrlToScriptId(githubUrl);
  const snippet = `&lt;div id="ghe-${scriptId}"&gt;&lt;/div&gt;&lt;script type="module" src="${context.request.url.origin}/embed-script/${scriptId}"&gt;&lt;/script&gt;`;

  context.response.body = `
    <!DOCTYPE html>
    <html lang="en">
    
    ${head}
    <body>
    <main>
        <h1>Embed this script on your webpage</h1>
        <h2>Snippet</h2>
        <strong>URL</strong>: <a href="${githubUrl}">${githubUrl}</a>
        <label for="snippet">Embed Code</label>        
        <textarea id="snippet">${snippet}</textarea>
        <button id="copyButton">Copy snippet</button>

        <h2>Preview</h2>
        <div id="ghe-${scriptId}" class="box"></div>
        <script type="module" src="/embed-script/${scriptId}"></script>
        <script>
        function copyToClipboard() {
          const textToCopy = document.getElementById('snippet');
          textToCopy.select();
          textToCopy.setSelectionRange(0, 99999); // For mobile devices
          document.execCommand('copy');
          alert('Snippet to you clipboard!');
        }
    
        document.getElementById('copyButton').addEventListener('click', copyToClipboard);
        </script>
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
        ${await Deno.readTextFile("./markdown.esm.js")}
  
        (async function() {
          const containerId = "markdown-container";
          await embedMarkdownFromGithub("${repoOwner}", "${repoName}", "${filePath}", "ghe-${scriptId}");
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
