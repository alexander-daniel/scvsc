const vscode = require('vscode');

const statusBar = vscode.window.createStatusBarItem('scstatus', 2);

const SCLANG_STATUS_BAR = 'sclang';
const SCLANG_STATUS_BAR_OFF = `${SCLANG_STATUS_BAR} ⭕`;
const SCLANG_STATUS_BAR_ON = `${SCLANG_STATUS_BAR} 🟢`;

statusBar.text = SCLANG_STATUS_BAR_OFF;
statusBar.command = 'supercollider.toggleSCLang';
statusBar.tooltip = 'Click to boot or quit the SuperCollider interpreter.';

async function initStatusBar() {
  statusBar.show();
  return;
}

function show() {
  statusBar.show();
}

function setText(statusBarText) {
  return statusBar.text = statusBarText;
}

module.exports = {
  initStatusBar,
  show,
  setText,
  SCLANG_STATUS_BAR_ON,
  SCLANG_STATUS_BAR_OFF,
};
