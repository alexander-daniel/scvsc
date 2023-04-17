const vscode = require('vscode');
const { stringifyError } = require('./util');
const Lang = require("supercolliderjs").lang.default;
// const { flashHighlight } = require('./util');

let lang = null;

async function activate(context) {

    const configuration = vscode.workspace.getConfiguration();
    const scLangPath = configuration.get('supercollider.sclang.cmd');

    const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
    const hyperScopes = await hyperScopesExt.activate();

    const log = vscode.window.createOutputChannel('vscsc');
    log.show();
    const statusBar = vscode.window.createStatusBarItem('scstatus', 2);

    statusBar.text = 'sclang 🔴';
    statusBar.show();

    vscode.window.onDidChangeActiveTextEditor(() => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const res = hyperScopes.reloadScope(editor.document);
            console.log(res);
        }
    }, null, context.subscriptions);

    let startSCLang = vscode.commands.registerCommand('supercollider.startSCLang', async () => {
        try {
            lang = new Lang({ sclang: scLangPath || "/Applications/SuperCollider.app/Contents/MacOS/sclang" });
            lang.on('stdout', (message) => {
                if (message == '\n') return;
                log.append(message);
            });
            lang.on('stderr', (message) => log.append(message.trim()));
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
            log.appendLine(result);
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
                // flashHighlight(vscode.window.activeTextEditor, selectionRange);
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

                // not totally sure about this --
                // it has been hastily ported it from hadron editor so I still gotta learn how it works.
                const { scopes } = hyperScopes.getScopeAt(editor.document, new vscode.Position(i, j));
                const scopesLength = scopes.length - 1;
                const lastScope = scopes[scopesLength];
                if (
                    lastScope === 'comment.single.supercollider' ||
                    lastScope === 'comment.multiline.supercollider' ||
                    lastScope === 'string.quoted.double.supercollider' ||
                    lastScope === 'entity.name.symbol.supercollider' ||
                    lastScope === 'constant.character.escape.supercollider'
                ) {
                    continue;
                }

                // gather the bracket ranges
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

        const selectionRange = new vscode.Range(
            range[0],
            0,
            range[1],
            Infinity // probably want to calculate this value later from the last line length
        );
        const highlighted = editor.document.getText(selectionRange);

        try {
            const result = await lang.interpret(highlighted, null, true, true, true);
            console.log(result);
            log.appendLine(result.trim());

            // flashHighlight(vscode.window.activeTextEditor, selectionRange);
        }
        catch (err) {
            const errString = stringifyError(err);
            log.appendLine(errString);
            console.error(errString);
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