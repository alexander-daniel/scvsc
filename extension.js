const vscode = require('vscode');
const Lang = require("supercolliderjs").lang.default;

async function activate(context) {

    let lang = null;

    const log = vscode.window.createOutputChannel('vscsc');
    const statusBar = vscode.window.createStatusBarItem('scstatus', 2);
    statusBar.text = 'sclang 🔴';
    statusBar.show();

    let startSCLang = vscode.commands.registerCommand('supercollider.startSCLang', async () => {
        try {

            lang = new Lang();
            lang.on('stdout', (message) => console.log(message))
            lang.on('stderr', (message) => console.error(message))
            await lang.boot();

            console.log('sclang ready');
            log.appendLine('sclang readyyyy');
            statusBar.text = 'sclang 🟢';
            statusBar.show();
        }
        catch (err) {
            console.log(err);
        }
    });

    context.subscriptions.push(startSCLang);

    let bootSCServer = vscode.commands.registerCommand('supercollider.bootServer', async () => {
        if (!lang) {
            console.error('sclang not started, cannot boot scsynth using s.boot.');
            return;
        }
        try {
            const result = await lang.interpret('s.boot', null, true, false);
            console.log(result);
        } catch (err) {
            console.error(err);
        }
    });

    context.subscriptions.push(bootSCServer);

    let hushAll = vscode.commands.registerCommand('supercollider.hush', async () => {
        if (!lang) {
            console.error('sclang not started, cannot hush.');
            return;
        }
        try {
            const result = await lang.interpret('CmdPeriod.run', null, true, false);
            console.log(result);
        } catch (err) {
            console.error(err);
        }

    });

    context.subscriptions.push(hushAll);

    let evaluateHighlighted = vscode.commands.registerCommand('supercollider.evaluateHighlighted', async () => {

        if (!lang) {
            console.error('sclang not started, cannot boot scsynth.');
        }

        const editor = vscode.window.activeTextEditor;
        const selection = editor.selection;
        if (selection && !selection.isEmpty) {
            const selectionRange = new vscode.Range(
                selection.start.line,
                selection.start.character,
                selection.end.line,
                selection.end.character
            );
            const highlighted = editor.document.getText(selectionRange);

            try {
                const result = await lang.interpret(highlighted, null, true, false);
                console.log(result);
            }
            catch (err) {
                debugger;
                console.log(err);
            }
        }
    });

    context.subscriptions.push(evaluateHighlighted);

}

exports.activate = activate;

function deactivate() {
    if (lang) {
        lang.quit();
        lang = null;
    }

}
exports.deactivate = deactivate;