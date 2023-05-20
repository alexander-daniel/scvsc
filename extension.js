const vscode = require('vscode');
const SC = require('./lang');

async function activate(context) {
  SC.initStatusBar();

  const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
  const hyperScopes = await hyperScopesExt.activate();

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

  const boot = vscode.commands.registerCommand('supercollider.boot', SC.boot);
  const quit = vscode.commands.registerCommand('supercollider.quit', SC.quit);
  const reboot = vscode.commands.registerCommand('supercollider.reboot', SC.reboot);
  const evaluate = vscode.commands.registerCommand('supercollider.evaluate', SC.evaluate);
  const hush = vscode.commands.registerCommand('supercollider.hush', SC.hush);
  context.subscriptions.push(boot, quit, reboot, evaluate, hush);
}

exports.activate = activate;

async function deactivate() {
  await SC.quit();
}

exports.deactivate = deactivate;
