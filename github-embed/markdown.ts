import { marked, Renderer } from "https://esm.sh/marked@4.2.12";
export { embedMarkdownFromGithub };

async function fetchMarkdownFromGithub(
  repoOwner: string,
  repoName: string,
  filePath: string
): Promise<string> {
  const fileUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${filePath}`;
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Error fetching Markdown file: ${response.statusText}`);
  }

  return await response.text();
}

function createMarkdownToHtmlConverter(
  repoOwner: string,
  repoName: string
): (markdown: string) => string {
  const renderer = new Renderer({});

  const buildAbsoluteGithubUrl = (
    repoOwner: string,
    repoName: string,
    href: string
  ) => {
    const isAbsolutePath = href.startsWith("/");
    const isRelativePath = !href.startsWith("http") && !isAbsolutePath;
    const baseUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main`;

    if (isAbsolutePath) {
      return `${baseUrl}${href}`;
    } else if (isRelativePath) {
      return `${baseUrl}/${href}`;
    }

    return href;
  };

  renderer.link = (href, title, text) => {
    href = buildAbsoluteGithubUrl(repoOwner, repoName, href);
    title = title ? ` title="${title}"` : "";
    return `<a href="${href}"${title}>${text}</a>`;
  };

  renderer.image = (src, title, alt) => {
    src = buildAbsoluteGithubUrl(repoOwner, repoName, src);
    title = title ? ` title="${title}"` : "";
    alt = alt ? ` alt="${alt}"` : "";
    return `<img src="${src}"${alt}${title}>`;
  };

  return (markdown: string) => {
    return marked(markdown, { renderer });
  };
}

function embedHtmlContent(html: string, containerId: string): void {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = html;
  } else {
    console.error(`Container with ID "${containerId}" not found.`);
  }
}

async function embedMarkdownFromGithub(
  repoOwner: string,
  repoName: string,
  filePath: string,
  containerId: string
): Promise<void> {
  try {
    const markdown = await fetchMarkdownFromGithub(
      repoOwner,
      repoName,
      filePath
    );
    const convertMarkdownToHtml = createMarkdownToHtmlConverter(
      repoOwner,
      repoName
    );
    const html = convertMarkdownToHtml(markdown);
    embedHtmlContent(html, containerId);
  } catch (error) {
    console.error(`Error embedding Markdown: ${error.message}`);
  }
}
