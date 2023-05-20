# scvsc

`scvsc` is a [SuperCollider](https://supercollider.github.io/)
extension for
[Visual Studio Code](https://code.visualstudio.com/).

Highly inspired by [Hadron](https://github.com/htor/hadron-editor), and took some code from [vscode-supercollider](https://github.com/jatinchowdhury18/vscode-supercollider). There's still a lot to learn from Hadron!

## Features

- Starting `sclang` and `scsynth` from vscode
- Evaluating selected text
- Evaluating regions between parentheses `( )`
- Hushing the server
- Highlight the lines that are being sent to be interpreted for like 2 seconds.

I've only tested this on MacOS.

## Instructions

1. Install the scvsc extension
2. Install [SuperCollider](https://supercollider.github.io/).
3. (optional) configure the location of your `sclang` instance in your vscode `settings.json`:
   - example: `"supercollider.sclang.cmd": "/Applications/SuperCollider.app/Contents/MacOS/sclang",`
4. The `scvsc` commands will be available in your vscode command palette, and you can map them to whatever keyboard shortcuts you like.
5. Alternatively, if you want to emulate the SCIDE keybindings, go to File -> Preferences -> Settings -> Extensions -> scvsc and set "Use Scide Keybindings" to `true`.


### Installing for development

1. Clone repository.
2. Run `npm install` in repo root at the command line.
3. Open `extension.js` in VSCode and press `F5`. Select the option to run the "Extension Development Host."
4. Open a `.scd` file. You may be prompted to install the HyperScope vscode extension, allow it. You will see an "sclang" indicator in the lower left.

## Reasonable Future Improvements

- open up docs in browser
- make the status bar more informative / nicer looking

## Hoop Dreams

- Auto-complete or suggestions
- use a language server or something or learn about language server in vscode
- open up docs directly in vscode? some kinda html renderer or something?

## License

scvsc is licensed under the
[MIT License](https://opensource.org/licenses/MIT).
