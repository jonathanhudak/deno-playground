export function githubUrlToScriptId(githubUrl: string) {
  const [, , , repoOwner, repoName, , ...filePathParts] = githubUrl.split("/");
  const filePath = filePathParts.join("/");
  return btoa(`${repoOwner}:${repoName}:${filePath}`);
}

export function createScriptUrl(scriptId: string, origin: string) {
  return `${origin}/embed-script/${scriptId}`;
}

export function createHTMLTargetId(scriptId: string) {
  return `ghe-${scriptId}`;
}

export function createHTMLCodeSnippet(scriptId: string, origin: string) {
  return `<div id="${createHTMLTargetId(
    scriptId
  )}"></div><script type="module" src="${origin}/embed-script/${scriptId}"></script>`;
}
