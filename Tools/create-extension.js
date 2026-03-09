const fs = require('fs');
const path = require('path');

// Function to create a VS Code extension
function createExtension(name, description, targetDir = './') {
  const extDir = path.join(targetDir, name);

  // Create directory
  if (!fs.existsSync(extDir)) {
    fs.mkdirSync(extDir, { recursive: true });
  }

  // Create package.json
  const packageJson = {
    name: name,
    displayName: name,
    description: description,
    version: '0.0.1',
    engines: { vscode: '^1.74.0' },
    categories: ['Other'],
    activationEvents: [`onCommand:${name}.start`],
    main: './out/extension.js',
    contributes: {
      commands: [{
        command: `${name}.start`,
        title: `Start ${name}`
      }]
    },
    scripts: {
      compile: 'tsc -p ./',
      watch: 'tsc -watch -p ./'
    },
    devDependencies: {
      '@types/vscode': '^1.74.0',
      'typescript': '^4.9.5'
    }
  };

  fs.writeFileSync(path.join(extDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      module: 'commonjs',
      target: 'ES2020',
      outDir: 'out',
      lib: ['ES2020'],
      sourceMap: true,
      rootDir: 'src',
      strict: true
    },
    exclude: ['node_modules']
  };

  fs.writeFileSync(path.join(extDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // Create src directory and extension.ts
  const srcDir = path.join(extDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  const extensionTs = `import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('${name}.start', () => {
    vscode.window.showInformationMessage('${description}');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}`;

  fs.writeFileSync(path.join(srcDir, 'extension.ts'), extensionTs);

  console.log(`VS Code extension '${name}' created in ${extDir}`);
}

// Usage: node create-extension.js <name> <description> [targetDir]
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node create-extension.js <name> <description> [targetDir]');
  process.exit(1);
}

createExtension(args[0], args[1], args[2]);