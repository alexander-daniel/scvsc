const vscode = require('vscode');
const Lang = require("supercolliderjs").lang.default;

async function activate(context) {

    let lang = null;

    const configuration = vscode.workspace.getConfiguration();
    const scLangPath = configuration.get('supercollider.sclang.cmd');

    const log = vscode.window.createOutputChannel('vscsc');
    const statusBar = vscode.window.createStatusBarItem('scstatus', 2);

    statusBar.text = 'sclang 🔴';
    statusBar.show();

    let startSCLang = vscode.commands.registerCommand('supercollider.startSCLang', async () => {
        try {
            lang = new Lang({ sclang: scLangPath || "/Applications/SuperCollider.app/Contents/MacOS/sclang" });
            lang.on('stdout', (message) => log.appendLine(message.trim()))
            lang.on('stderr', (message) => log.appendLine(message.trim()))
            await lang.boot();

            log.appendLine('sclang ready');

            statusBar.text = 'sclang 🟢';
            statusBar.show();
        }
        catch (err) {
            log.appendLine(err);
            console.log(err);
        }
    });

    context.subscriptions.push(startSCLang);

    let bootSCServer = vscode.commands.registerCommand('supercollider.bootServer', async () => {
        if (!lang) {
            log.appendLine('sclang not started, cannot boot scsynth using s.boot.');
            return;
        }
        try {
            const result = await lang.interpret('s.boot', null, true, false);
            console.log(result);
            log.appendLine(result.trim());
        } catch (err) {
            log.appendLine(err);
            console.error(err);
        }
    });

    context.subscriptions.push(bootSCServer);

    let hushAll = vscode.commands.registerCommand('supercollider.hush', async () => {
        if (!lang) {
            log.appendLine('sclang not started, cannot hush.');
            return;
        }
        try {
            const result = await lang.interpret('CmdPeriod.run', null, true, false);
            log.appendLine(result.trim());
        } catch (err) {
            log.appendLine(err);
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
                log.appendLine(result.trim());
            }
            catch (err) {
                log.appendLine(err);
                console.error(err);
            }
        }
    });

    context.subscriptions.push(evaluateHighlighted);

    let evalRegion = vscode.commands.registerCommand('supercollider.evalRegion', async () => {

        if (!lang) {
            log.appendLine('sclang not started, cannot evaluate region.');
        }

        const editor = vscode.window.activeTextEditor;
        const selection = editor.selection;

        const ranges = []
        let brackets = 0;

        // Get the total line count of the open script
        const lineCount = vscode.window.activeTextEditor.document.lineCount;

        // For every line, get the text of that line as a string.
        for (let i = 0; i < lineCount; i++) {
            const { text } = vscode.window.activeTextEditor.document.lineAt(i);

            // for every character on the line, check to see if it's a paren
            for (let j = 0; j < text.length; j++) {
                const char = text.charAt(j);
                if (char === '(' && brackets++ === 0) {
                    ranges.push([i])
                } else if (char === ')' && --brackets === 0) {
                    ranges[ranges.length - 1].push(i)
                }
            }
        }

        // Get where the current cursor is
        const position = vscode.window.activeTextEditor.selection.active;

        // not totally sure about this --
        // it has been hastily ported it from hadron editor so I still gotta learn how it works.
        const range = ranges.find((range) => {
            return range[0] <= position.c && position.c <= range[1]
        });

        // could probably use this too
        // const selectionRange = new vscode.Range(
        //     selection.start.line,
        //     selection.start.character,
        //     selection.end.line,
        //     selection.end.character
        // );
        // const highlighted = editor.document.getText(selectionRange);


        let start = range[0];
        let end = range[1];
        let buf = '';

        for (let i = start; i <= end; i++) {
            const { text } = vscode.window.activeTextEditor.document.lineAt(i);
            buf += text;
        }

        try {
            const result = await lang.interpret(buf, null, true, false);
            log.appendLine(result.trim());
        }
        catch (err) {
            log.appendLine(err);
            console.error(err);
        }

    });

    context.subscriptions.push(evalRegion);
}

exports.activate = activate;

function deactivate() {
    if (lang) {
        lang.quit();
        lang = null;
    }

}
exports.deactivate = deactivate;