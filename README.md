# vaivoo-site

Static site + knowledge base for **vaivoo.com**. Content lives in this repo; GitHub is the database, the review gate and the audit log.

## How it works
| Step | Where |
|---|---|
| Add/edit an entity | `content/entities/<id>.yaml` (schema: `schema/entity.schema.json`) |
| Propose | Open a pull request (Claude/agent opens PRs only) |
| Check | `validate.yml` runs schema + editorial gates + full build |
| Approve | Christian merges (branch protection on `main`) |
| Release | SiteGround Node.js Project (linked to `main`) builds and deploys automatically |
| Roll back | `git revert` the merge → redeploys previous state |

Only entities with `status: published` and claims with `status: approved` are shown as fact. Anything else renders as "not yet verified".

## Editorial gates enforced by `scripts/validate.mjs`
- Schema valid; filename = id; unique ids, slugs, names and aliases
- Relations point to existing entities
- Approved claim → at least one supporting source, reviewer and date
- Tier C claim → two reviewers (owner + independent technical reviewer)
- Conditional value → conditions stated
- Published entity → `last_verified_at` and `next_review_at`

## Local use
```
npm install
npm run validate
PREVIEW_DRAFTS=1 npm run dev     # see drafts locally
npm run build                    # what CI runs
```

## One-time setup (SiteGround GrowBig, Node.js Project)
1. Client Area → Websites → **Node.js Projects** → Add project → **GitHub** → repo `cypherzoo/vaivoo`, branch `main`.
2. Build settings: framework **Astro**, Node **22**, package manager **npm**, build command `npm run build`, output directory `dist`.
3. Test on the temporary domain SiteGround assigns. Point vaivoo.com to the project once the domain transfer is done.
4. GitHub → Settings → Branches: protect `main` (require PR + passing `validate`, no direct pushes). This is the publication gate.
5. After first deploy, check headers at securityheaders.com. If `.htaccess` is not honoured by the Node.js project, set HTTPS enforcement in Site Tools and we move headers into config.

Fallback: `.github/workflows/deploy.yml` (manual SSH/rsync) — secrets `SG_SSH_KEY`, `SG_HOST`, `SG_PORT`, `SG_USER`, `SG_REMOTE_DIR`, `SG_KNOWN_HOSTS`.
