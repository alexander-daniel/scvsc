const vscode = require('vscode');
const { stringifyError } = require('./util');
const Lang = require('supercolliderjs').lang.default;
const { flashHighlight } = require('./util');

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

  const evaluateHighlighted = vscode.commands.registerCommand(
    'supercollider.evaluateHighlighted',
    async () => {
      if (!lang) {
        console.error('sclang not started, cannot boot scsynth.');
        return;
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
          postWindow.appendLine(result.trim());
          flashHighlight(vscode.window.activeTextEditor, selectionRange);
        } catch (err) {
          postWindow.appendLine(err);
          console.error(err);
        }
      }
    }
  );

  context.subscriptions.push(evaluateHighlighted);

  const evalRegion = vscode.commands.registerCommand(
    'supercollider.evalRegion',
    async () => {
      if (!lang) {
        postWindow.appendLine('sclang not started, cannot evaluate region.');
        return;
      }

      const editor = vscode.window.activeTextEditor;
      const ranges = [];
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
          const { scopes } = hyperScopes.getScopeAt(
            editor.document,
            new vscode.Position(i, j)
          );
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
            ranges.push([i]);
          } else if (char === ')' && --brackets === 0) {
            ranges[ranges.length - 1].push(i);
          }
        }
      }
      // Get where the current cursor is
      const position = vscode.window.activeTextEditor.selection.active;

      // not totally sure about this --
      // it has been hastily ported it from hadron editor so I still gotta learn how it works.
      const range = ranges.find((range) => {
        return range[0] <= position.c && position.c <= range[1];
      });

      const { text } = vscode.window.activeTextEditor.document.lineAt(range[1]);
      const lastLineLength = text.length;

      const selectionRange = new vscode.Range(
        range[0],
        0, // will need to calculate ... because what if the paren is not the first char on the line? does that matter?
        range[1],
        lastLineLength
      );
      const highlighted = editor.document.getText(selectionRange);

      try {
        const result = await lang.interpret(
          highlighted,
          null,
          true,
          true,
          true
        );
        console.log(result);
        postWindow.appendLine(result.trim());
        flashHighlight(vscode.window.activeTextEditor, selectionRange);
      } catch (err) {
        const errString = stringifyError(err);
        postWindow.appendLine(errString);
        console.error(errString);
      }
    }
  );

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
