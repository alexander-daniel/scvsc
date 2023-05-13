const vscode = require('vscode');
const { flashHighlight, stringifyError } = require('./util');

async function evalHighlighted(lang, postWindow, selection) {
  const selectionRange = new vscode.Range(
    selection.start.line,
    selection.start.character,
    selection.end.line,
    selection.end.character
  );

  const editor = vscode.window.activeTextEditor;
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

async function evalRegion(lang, postWindow) {
  const ranges = [];
  let brackets = 0;

  const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
  const hyperScopes = await hyperScopesExt.activate();
  const editor = vscode.window.activeTextEditor;
  const highlighted = editor.document.getText(selectionRange);

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
    const result = await lang.interpret(highlighted, null, true, true, true);
    console.log(result);
    postWindow.appendLine(result.trim());
    flashHighlight(vscode.window.activeTextEditor, selectionRange);
  } catch (err) {
    const errString = stringifyError(err);
    postWindow.appendLine(errString);
    console.error(errString);
  }
}

module.exports = {
  evalHighlighted,
  evalRegion,
};
