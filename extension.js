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

  const startSCLang = vscode.commands.registerCommand('supercollider.startSCLang', SC.startSCLang);
  const stopSCLang = vscode.commands.registerCommand('supercollider.stopSCLang', SC.stopSCLang);
  const bootSCSynth = vscode.commands.registerCommand('supercollider.startSCSynth', SC.bootSCSynth);
  const rebootSCLang = vscode.commands.registerCommand('supercollider.rebootSCLang', SC.rebootSCLang);
  const evaluate = vscode.commands.registerCommand('supercollider.evaluate', SC.evaluate);
  const hush = vscode.commands.registerCommand('supercollider.hush', SC.hush);
  context.subscriptions.push(startSCLang, stopSCLang, bootSCSynth, rebootSCLang, evaluate, hush);
}

exports.activate = activate;

async function deactivate() {
  await SC.rebootSCLang();
}

exports.deactivate = deactivate;
