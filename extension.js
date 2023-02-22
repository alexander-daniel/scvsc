const vscode = require('vscode');
const sc = require("supercolliderjs");

async function activate(context) {

    let _lang;

    try {
        // Probably not the best place to do this, but right now it's efficient
        _lang = await sc.lang.boot();
        _lang.on('stdout', (message) => console.log(message))
        _lang.on('stderr', (message) => console.error(message))
        console.log('sclang ready')
    }
    catch (err) {
        console.log(err);
    }

    let bootSCServer = vscode.commands.registerCommand('supercollider.bootServer', async () => {
        const result = await _lang.interpret('s.boot', null, true, false);
        console.log(result);
    });

    context.subscriptions.push(bootSCServer);

    let sendCode = vscode.commands.registerCommand('supercollider.sendCode', async () => {
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
                const result = await _lang.interpret(highlighted, null, true, false);
                console.log(result);
            }
            catch (err) {
                debugger;
                console.log(err);
            }
        }
    });

    context.subscriptions.push(sendCode);

}

exports.activate = activate;

function deactivate() {
    if (_lang) {
        _lang.quit();
    }

}
exports.deactivate = deactivate;