import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node scripts/patch-dart-openapi-client.mjs <generated-api-lib-dir>');
  process.exit(1);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(filePath);
      continue;
    }

    if (!entry.name.endsWith('.dart')) {
      continue;
    }

    let source = fs.readFileSync(filePath, 'utf8');

    if (!source.includes('// @dart=')) {
      const lines = source.split('\n');
      let insertAt = 0;
      for (let index = 0; index < lines.length; index += 1) {
        if (lines[index].trim() !== '' && !lines[index].startsWith('//')) {
          insertAt = index;
          break;
        }
      }
      lines.splice(insertAt, 0, '// @dart=3.0', '');
      source = lines.join('\n');
    }

    source = source.replaceAll(
      "b..role = 'USER'",
      'b..role = CreateAdminUserDtoRoleEnum.USER',
    );

    fs.writeFileSync(filePath, source);
  }
}

walk(path.join(root, 'lib'));
