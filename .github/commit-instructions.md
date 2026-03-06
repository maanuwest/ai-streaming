# commit-helper

Review all current changes briefly, ensure build + lint pass.
Commit directly to the branch.

Rules:

- No feature branch.
- One clean commit.
- Clear, conventional commit message.
- No WIP, no “fix stuff”, no noise.

Commit message format:
<type>(scope): concise summary

Optional body:

- what changed
- why (if not obvious)

Then commit via CLI.
