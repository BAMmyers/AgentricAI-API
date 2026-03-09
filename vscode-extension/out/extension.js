"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const node_fetch_1 = require("node-fetch");
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.AGENTRICAI_MODEL || 'lacy:latest';
const FALLBACK_MODEL = 'AgentricAIcody:latest';
let conversationHistory = [];
async function getAvailableModel() {
    const modelsToTry = [DEFAULT_MODEL, FALLBACK_MODEL];
    try {
        const response = await (0, node_fetch_1.default)(`${OLLAMA_HOST}/api/tags`);
        if (response.ok) {
            const data = await response.json();
            const availableModels = data.models?.map((m) => m.name) || [];
            for (const model of modelsToTry) {
                if (availableModels.includes(model)) {
                    return model;
                }
            }
        }
    }
    catch (error) {
        console.warn('Could not fetch available models:', error);
    }
    return DEFAULT_MODEL;
}
async function chatWithOllama(messages, model) {
    try {
        const response = await (0, node_fetch_1.default)(`${OLLAMA_HOST}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                system: "You are a code generation assistant for the AgentricAI ecosystem. Convert user requests into clean, functional Python code. Always provide code in markdown blocks. Focus on scalability, maintainability, and integration with AgentricAI workflows. You can also read, edit, and execute code in the codebase.",
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        const data = await response.json();
        return data.message?.content || 'No response from model';
    }
    catch (error) {
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}
async function handleChatRequest(request, context, stream, token) {
    if (request.command === 'help') {
        handleHelpCommand(request, context, stream, token);
        return;
    }
    const model = await getAvailableModel();
    // Add system context if needed
    const messages = [
        ...conversationHistory,
        { role: 'user', content: request.prompt }
    ];
    // Add context from current file or selection
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        const document = activeEditor.document;
        const selection = activeEditor.selection;
        const selectedText = document.getText(selection);
        if (selectedText) {
            messages.push({
                role: 'system',
                content: `Current file: ${document.fileName}\nSelected code:\n${selectedText}`
            });
        }
    }
    stream.progress('Generating response...');
    const response = await chatWithOllama(messages, model);
    // Update conversation history
    conversationHistory.push({ role: 'user', content: request.prompt });
    conversationHistory.push({ role: 'assistant', content: response });
    // Keep history limited
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
    }
    stream.markdown(response);
    // If response contains code, offer to apply it
    if (response.includes('```')) {
        stream.button({
            command: 'agentricai.applyCode',
            title: 'Apply Code',
            arguments: [response]
        });
    }
}
function handleHelpCommand(request, context, stream, token) {
    stream.markdown(`**AgentricAI Chat Assistant Help**

Available commands:
- Ask questions about code
- Request code generation
- Get help with AgentricAI ecosystem
- Use "clear" to reset conversation

The assistant can:
- Generate Python code
- Read and analyze your codebase
- Provide inline suggestions
- Execute code safely

Model: ${DEFAULT_MODEL} (fallback: ${FALLBACK_MODEL})
Ollama Host: ${OLLAMA_HOST}`);
}
function activate(context) {
    // Register chat participant
    const participant = vscode.chat.createChatParticipant('agentricai.chat', handleChatRequest);
    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png'); // Add icon if available
    // Register command to apply code
    const applyCodeCommand = vscode.commands.registerCommand('agentricai.applyCode', async (codeResponse) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor to apply code to.');
            return;
        }
        // Extract code from markdown
        const codeMatch = codeResponse.match(/```python\n([\s\S]*?)\n```/);
        if (codeMatch) {
            const code = codeMatch[1];
            const edit = new vscode.WorkspaceEdit();
            edit.replace(activeEditor.document.uri, activeEditor.selection, code);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Code applied to editor.');
        }
        else {
            vscode.window.showErrorMessage('No Python code found in response.');
        }
    });
    context.subscriptions.push(participant, applyCodeCommand);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map