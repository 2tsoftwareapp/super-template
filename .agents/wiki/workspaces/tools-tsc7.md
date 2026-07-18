# TypeScript 7 Alias Isolator

## Tổng quan (80/20)

- **Vai trò**: Hoists `typescript7` (npm:typescript@7.0.2) ngoài peer-resolution context để dùng native/Go `tsc` binary cho typecheck/build.
- **Layer**: tool

## Chi tiết

### Vấn đề

Project cần TS7 cho typecheck nhưng tools (ESLint, ts-node, Next.js) chưa compatible. Solution: isolator package.

### Usage

```bash
node ../../tools/tsc7/node_modules/typescript7/bin/tsc -p tsconfig.json
```

---

Nguồn: `tools/tsc7/package.json`, `tools/tsc7/`
Last-synced: `8411838`
