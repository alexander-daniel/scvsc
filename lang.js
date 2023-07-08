const vscode = require('vscode');
const Lang = require('supercolliderjs').lang.default;
const statusBar = require('./status-bar');
const { flashHighlight, stringifyError, getDefaultSCLangExecutable } = require('./util');

let lang = null;
let polling = null;

const postWindow = vscode.window.createOutputChannel('scvsc postWindow');

async function startSCLang() {
  const configuration = vscode.workspace.getConfiguration();
  const scLangPath = configuration.get('supercollider.sclang.cmd');
  if (lang) {
    postWindow.appendLine('there is already an instance of sclang running.');
    return;
  }

  try {
    lang = new Lang({
      sclang: scLangPath || getDefaultSCLangExecutable(),
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
    statusBar.sclangStatus.text = statusBar.SCLANG_STATUS_BAR_LANG_ON;
    statusBar.sclangStatus.show();
  } catch (err) {
    postWindow.appendLine(err);
    console.error(err);
  }
}

async function killSCSynth() {
  try {
    await lang.interpret('Server.killAll');
    clearInterval(polling);
    statusBar.scsynthStatus.text = statusBar.SCLANG_STATUS_BAR_SERVER_OFF;
  } catch (err) {
    console.error(err);
  }
}

async function stopSCLang() {
  try {
    await killSCSynth();
    await lang.quit();
    lang = null;
    statusBar.sclangStatus.text = statusBar.SCLANG_STATUS_BAR_LANG_OFF;
    statusBar.sclangStatus.show();
  } catch (err) {
    postWindow.appendLine(err);
    console.error(err);
  }
}

async function rebootSCLang() {
  try {
    await lang.quit();
    await lang.boot();
  } catch (err) {
    postWindow.appendLine(err);
    console.error(err);
  }
}

async function toggleSCLang() {
  if (lang === null) {
    await startSCLang();
  } else {
    await stopSCLang();
  }
}

async function bootSCSynth() {
  if (!lang) {
    postWindow.appendLine('sclang not started, cannot boot scsynth using s.boot.');
    return;
  }
  try {
    const result = await lang.interpret('s.boot', null, true, false);
    console.log(result);
    polling = setInterval(pollServerStatus, 500);
    postWindow.appendLine(result);
  } catch (err) {
    postWindow.appendLine(err);
    console.error(err);
  }
}

async function evaluate() {
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
  } else {
    const ranges = [];
    let brackets = 0;

    const hyperScopesExt = vscode.extensions.getExtension('draivin.hscopes');
    const hyperScopes = await hyperScopesExt.activate();
    const editor = vscode.window.activeTextEditor;

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
}

async function hush() {
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

async function getServerStatus() {
  try {
    const peakCPU = (await lang.interpret('Server.local.peakCPU')).toFixed(2);
    const averageCPU = (await lang.interpret('Server.local.avgCPU')).toFixed(2);
    const uGens = await lang.interpret('Server.local.numUGens');
    const synths = await lang.interpret('Server.local.numSynths');
    const groups = await lang.interpret('Server.local.numGroups');
    const synthDefs = await lang.interpret('Server.local.numSynthDefs');
    return { peakCPU, averageCPU, uGens, synths, groups, synthDefs };
  } catch (err) {
    console.error(err);
  }
}

async function pollServerStatus() {
  try {
    const serverStatus = await getServerStatus();
    if (serverStatus) {
      statusBar.updateSCSynthStatus(serverStatus);
    }
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  startSCLang,
  stopSCLang,
  rebootSCLang,
  toggleSCLang,
  bootSCSynth,
  killSCSynth,
  evaluate,
  hush,
};
