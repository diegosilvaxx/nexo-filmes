import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const appsRoot = resolve(root, 'apps');
const configPath = resolve(root, 'tsconfig.json');
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const failures = [];

function application(file) {
  const path = relative(appsRoot, file);
  if (path.startsWith(`..${sep}`) || path === '..') return undefined;
  return path.split(sep)[0];
}

for (const file of parsed.fileNames) {
  const owner = application(file);
  if (!owner || file.includes(`${sep}__mf__virtual${sep}`)) continue;
  const source = ts.createSourceFile(
    file,
    ts.sys.readFile(file) ?? '',
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(node) {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) &&
            (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
              (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
          ? node.arguments[0]
          : undefined;
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const target = ts.resolveModuleName(specifier.text, file, parsed.options, ts.sys)
        .resolvedModule?.resolvedFileName;
      const targetOwner = target
        ? application(target)
        : /^@nexo\/(shell|catalog|movie|area)(?:\/|$)/.exec(specifier.text)?.[1];
      if (targetOwner && targetOwner !== owner) {
        const { line } = source.getLineAndCharacterOfPosition(specifier.getStart(source));
        failures.push(`${relative(root, file)}:${line + 1}: ${owner} importa ${targetOwner}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Arquitetura válida: nenhuma importação direta entre aplicações.');
}
