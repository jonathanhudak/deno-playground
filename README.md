# playground

## github-embed

Provide a url to a Github-hosted markdown file and embed it into your website dynamically.

Given a url: <https://github.com/jonathanhudak/github-embed/blob/main/README.md>

This deno server will output a snippet of code which will enable you to dynamically embed the markdown rendered as HTML into another HTML document.
```
<div id="ghe-am9uYXRoYW5odWRhazpnaXRodWItZW1iZWQ6bWFpbi9SRUFETUUubWQ="></div>
<script type="module" src="http://localhost:8000/embed-script/am9uYXRoYW5odWRhazpnaXRodWItZW1iZWQ6bWFpbi9SRUFETUUubWQ="></script>
```

This is essentially a clone of an awesome tool I recently discovered: https://emgithub.com/

## Resources

* CSS https://missing.style/docs/