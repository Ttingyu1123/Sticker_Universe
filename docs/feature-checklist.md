# Feature One-Page Checklist

## How to ask Codex to start skills
- Use this sentence before each new feature:
  - `這次新功能請啟動 feature-delivery-playbook + feature-architecture-standards，需求是：...`
- If only architecture refactor:
  - `這次只啟動 feature-architecture-standards，請先做邊界重構：...`
- If only delivery planning:
  - `這次只啟動 feature-delivery-playbook，請先出最小可交付方案：...`

## 10-step quick flow (copy and use)
1. Define goal: one paragraph of user value.
2. Define scope: in-scope / out-of-scope.
3. Define acceptance: observable pass criteria.
4. Confirm architecture: no `pages -> pages` coupling.
5. Place shared code: move reusable parts to `src/features/*`.
6. Place shared types: use `src/shared/types/*`.
7. Add bilingual copy: update `en.json` + `zh-TW.json` together.
8. Verify checks: run `npm run check:boundaries`.
9. Verify quality: run `npm run validate:i18n` and `npm run build`.
10. Ship safely: commit clearly, note rollback path, then deploy.

## PR minimum checklist
- [ ] Scope and acceptance criteria are written.
- [ ] No new architecture boundary violation.
- [ ] No raw i18n keys or `???` in UI.
- [ ] Desktop + mobile changed paths were manually checked.
- [ ] Build and validation commands passed.
