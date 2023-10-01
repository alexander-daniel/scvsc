const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

function getDefaultSCLangExecutable() {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/SuperCollider.app/Contents/MacOS/sclang';
    case 'win32':
      const root = 'C:\\Program Files';
      const directories = fs.readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("SuperCollider-"));
      if (directories.length > 0) {
        return path.join(root, directories[0].name, 'sclang.exe');
      }
      return 'sclang';
    default:
      return 'sclang';
  }
}

function stringifyError(value) {
  const { type, error } = value;
  if (type === 'SyntaxError') {
    value = `${type}: ${error.msg}`;
    value += `\n    line: ${error.line}, char: ${error.charPos}`;
    value += `\n${error.code}`;
  } else if (type === 'Error') {
    const args = (error.args || [])
      .map((arg) => `${arg.class} ${arg.asString}`)
      .join(', ');
    const receiver = error.receiver || 'no receiver';
    error.errorString = error.errorString || 'UnknownError';
    error.class = error.class || '';
    value = error.errorString.replace('ERROR', error.class);
    value += `\n    receiver: ${receiver.asString}, args: [${args}]`;
  }
  return value;
}

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
  stringifyError,
  getDefaultSCLangExecutable,
};
