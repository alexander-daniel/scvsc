const vscode = require('vscode');

function flashHighlight(editor, range, duration = 250) {
  const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'white',
    // border: '1px solid white',
  });

  editor.setDecorations(highlightDecoration, [{ range }]);

  setTimeout(() => {
    editor.setDecorations(highlightDecoration, []);
  }, duration);
}

module.exports = {
  flashHighlight,
};
