const vscode = require('vscode');
const SC = require('./lang');
const statusBar = require('./status-bar');

async function activate(context) {
  const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
  const hyperScopes = await hyperScopesExt.activate();

  statusBar.sclangStatus.show();
  statusBar.scsynthStatus.show();

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
  const rebootSCLang = vscode.commands.registerCommand('supercollider.rebootSCLang', SC.rebootSCLang);
  const toggleSCLang = vscode.commands.registerCommand('supercollider.toggleSCLang', SC.toggleSCLang);
  const bootSCSynth = vscode.commands.registerCommand('supercollider.bootSCSynth', SC.bootSCSynth);
  const killSCSynth = vscode.commands.registerCommand('supercollider.killSCSynth', SC.killSCSynth);
  const evaluate = vscode.commands.registerCommand('supercollider.evaluate', SC.evaluate);
  const hush = vscode.commands.registerCommand('supercollider.hush', SC.hush);
  context.subscriptions.push(
    startSCLang,
    stopSCLang,
    rebootSCLang,
    toggleSCLang,
    bootSCSynth,
    killSCSynth,
    evaluate,
    hush
  );
}

exports.activate = activate;

async function deactivate() {
  await SC.stopSCLang();
}

exports.deactivate = deactivate;
