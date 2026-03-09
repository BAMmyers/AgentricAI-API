"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    const disposable = vscode.commands.registerCommand('agentricai.startChat', () => {
        vscode.window.showInformationMessage('AgentricAI Chat Extension Activated. Use this to execute chat tasks in the AgentricAI ecosystem.');
        // Add logic to invoke the AgentricAI Code Agent or execute operations
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map