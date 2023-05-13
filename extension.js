const vscode = require('vscode');
const Lang = require('supercolliderjs').lang.default;
const { evalHighlighted, evalRegion } = require('./evaluate');

let lang = null;

async function activate(context) {
  const configuration = vscode.workspace.getConfiguration();
  const scLangPath = configuration.get('supercollider.sclang.cmd');
  const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
  const hyperScopes = await hyperScopesExt.activate();
  const postWindow = vscode.window.createOutputChannel('vscsc postWindow');
  const statusBar = vscode.window.createStatusBarItem('scstatus', 2);

  statusBar.text = 'sclang 🔴';
  statusBar.show();

  // This refreshes the token scope, but I don't think this is optimized.. but I haven't run into issues yet.
  vscode.window.onDidChangeActiveTextEditor(
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const res = hyperScopes.reloadScope(editor.document);
        console.log(res);
      }
    },
    null,
    context.subscriptions
  );

  const startSCLang = vscode.commands.registerCommand(
    'supercollider.startSCLang',
    async () => {
      if (lang) {
        postWindow.appendLine(
          'there is already an insteand of sclang running.'
        );
        return;
      }

      try {
        lang = new Lang({
          sclang:
            scLangPath ||
            '/Applications/SuperCollider.app/Contents/MacOS/sclang',
        });

        lang.on('stdout', (message) => {
          if (message == '\n') return;
          postWindow.append(message);
        });

        lang.on('stderr', (message) => postWindow.append(message.trim()));

        // Could probably conditional this based on a user config
        postWindow.show();

        await lang.boot();

        postWindow.appendLine('SCVSC: sclang is ready');
        statusBar.text = 'sclang 🟢';
        statusBar.show();
      } catch (err) {
        postWindow.appendLine(err);
        console.log(err);
      }
    }
  );

  context.subscriptions.push(startSCLang);

  const stopSCLang = vscode.commands.registerCommand(
    'supercollider.stopSCLang',
    async () => {
      if (!lang) {
        postWindow.appendLine('sclang is not currently running.');
        return;
      }

      try {
        await lang.quit();
        lang = null;
        statusBar.text = 'sclang 🔴';
        statusBar.show();
      } catch (err) {
        postWindow.appendLine(err);
        console.log(err);
      }
    }
  );

  context.subscriptions.push(stopSCLang);

  const bootSCServer = vscode.commands.registerCommand(
    'supercollider.bootServer',
    async () => {
      if (!lang) {
        postWindow.appendLine(
          'sclang not started, cannot boot scsynth using s.boot.'
        );
        return;
      }
      try {
        const result = await lang.interpret('s.boot', null, true, false);
        console.log(result);
        postWindow.appendLine(result);
      } catch (err) {
        postWindow.appendLine(err);
        console.error(err);
      }
    }
  );

  context.subscriptions.push(bootSCServer);

  const hushAll = vscode.commands.registerCommand(
    'supercollider.hush',
    async () => {
      if (!lang) {
        postWindow.appendLine('sclang not started, cannot hush.');
        return;
      }
      try {
        const result = await lang.interpret('CmdPeriod.run', null, true, false);
        postWindow.appendLine(result.trim());
      } catch (err) {
        postWindow.appendLine(err);
        console.error(err);
      }
    }
  );

  context.subscriptions.push(hushAll);

  const evaluate = vscode.commands.registerCommand(
    'supercollider.evaluate',
    async () => {
      if (!lang) {
        console.error('sclang not started, cannot boot scsynth.');
        return;
      }

      const editor = vscode.window.activeTextEditor;
      const selection = editor.selection;

      if (selection && !selection.isEmpty) {
        evalHighlighted(lang, postWindow, selection);
      } else {
        evalRegion(lang, postWindow);
      }
    }
  );

  context.subscriptions.push(evaluate);
}

exports.activate = activate;

function deactivate() {
  if (lang) {
    lang.quit();
    lang = null;
  }
}
exports.deactivate = deactivate;
