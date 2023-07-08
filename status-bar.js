const vscode = require('vscode');

const sclangStatus = vscode.window.createStatusBarItem('sclangStatus', 2);
const scsynthStatus = vscode.window.createStatusBarItem('scsynthStatus', 2);

const SCLANG_STATUS_BAR = 'sclang';
const SCLANG_STATUS_BAR_LANG_OFF = `${SCLANG_STATUS_BAR} ⭕`;
const SCLANG_STATUS_BAR_LANG_ON = `${SCLANG_STATUS_BAR} 🟢`;
const SCLANG_STATUS_BAR_SERVER_OFF = `0.00%  0.00%  0u  0s  0g  0d`;

sclangStatus.text = SCLANG_STATUS_BAR_LANG_OFF;
sclangStatus.command = 'supercollider.toggleSCLang';
sclangStatus.tooltip = 'Click to boot or quit the SuperCollider interpreter.';

scsynthStatus.text = SCLANG_STATUS_BAR_SERVER_OFF;

async function updateSCSynthStatus(serverStatus) {
  const { peakCPU, averageCPU, uGens, synths, groups, synthDefs } = serverStatus;
  scsynthStatus.text = `${peakCPU}%  ${averageCPU}%  ${uGens}u  ${synths}s  ${groups}g  ${synthDefs}d`;
}

module.exports = {
  sclangStatus,
  scsynthStatus,
  updateSCSynthStatus,
  SCLANG_STATUS_BAR_LANG_ON,
  SCLANG_STATUS_BAR_LANG_OFF,
  SCLANG_STATUS_BAR_SERVER_OFF,
};
