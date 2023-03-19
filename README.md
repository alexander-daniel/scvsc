# scvsc

`scvsc` is a [SuperCollider](https://supercollider.github.io/)
extension for
[Visual Studio Code](https://code.visualstudio.com/).


## Features
- Starting `sclang` and `scsynth` from vscode
- Evaluating selected text
- Evaluating regions between parentheses `( )`
- Hushing the server

I've only tested this on MacOS.

## Instructions

1. Install the scvsc extension
2. Install SuperCollider from the
   [SuperCollider website](https://supercollider.github.io/).


Gotta finish these while also detailing how to find your sclang and how to set it dynamically since right now i had to go into node_modules and hard-code it and that's not what i want to do.


## Reasonable Future Improvements
- Highlight the lines that are being sent to be interpreted for like 2 seconds.
- auto-open up output log of extension (postWindow) when starting sclang.
- open up docs in browser

## Hoop Dreams
- Auto-complete
- use a language server or something
- open up docs directly in vscode? some kinda html renderer or something?


## License

vscode-supercollider is licensed under the
[MIT License](https://opensource.org/licenses/MIT).
