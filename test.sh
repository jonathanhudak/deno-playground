#!/bin/bash

curl -X POST http://localhost:8000/embed-id \
   -H "Content-Type: application/json" \
   -d '{"githubUrl": "https://github.com/jonathanhudak/github-embed/blob/main/README.md" }' 