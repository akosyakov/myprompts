import { log } from 'console';
import * as vscode from 'vscode';

let logger: vscode.LogOutputChannel;

interface PromptCommand {
    title: string;
    prompt: string[];
    codeAction?: 'quickfix' | 'refactor' | 'extract' | 'inline' | 'move' | 'rewrite' | "no";
    languages?: string[];
}

export function activate(context: vscode.ExtensionContext) {
    logger = vscode.window.createOutputChannel('My Prompts', { log: true });
    context.subscriptions.push(logger);
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('myprompts.edit', run));
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', {
        provideCodeActions: (textDocument) => {
            const action = new vscode.CodeAction('My Prompts: Edit', vscode.CodeActionKind.RefactorRewrite);
            action.command = { command: 'myprompts.edit', title: 'My Prompts: Edit' };
            const actions = [action];

            const prompts = loadPrompts(textDocument);
            for (const prompt of prompts.values()) {
                if (!prompt.codeAction || prompt.codeAction === 'no') {
                    continue;
                }
                let kind = vscode.CodeActionKind.QuickFix;
                switch (prompt.codeAction) {
                    case 'refactor':
                        kind = vscode.CodeActionKind.Refactor;
                        break;
                    case 'extract':
                        kind = vscode.CodeActionKind.RefactorExtract;
                        break;
                    case 'inline':
                        kind = vscode.CodeActionKind.RefactorInline;
                        break;
                    case 'move':
                        kind = vscode.CodeActionKind.RefactorMove;
                        break;
                    case 'rewrite':
                        kind = vscode.CodeActionKind.RefactorRewrite;
                        break;
                }
                const action = new vscode.CodeAction(prompt.title, kind);
                action.command = {
                    command: 'myprompts.edit',
                    title: prompt.title,
                    arguments: [prompt.title]
                };
                actions.push(action);
            }

            return actions;
        }
    }));
}

export function deactivate() { }

async function run(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, title?: string) {
    const prompts = loadPrompts(textEditor.document);
    if (!prompts.size) {
        vscode.window.showErrorMessage("No prompts configured.");
        return;
    }

    if (!title) {
        const titles = [...prompts.keys()];
        title = await vscode.window.showQuickPick(titles, {
            placeHolder: 'Select a prompt to run'
        });
    }
    if (!title) {
        return;
    }

    const prompt = prompts.get(title);
    if (!prompt) {
        vscode.window.showErrorMessage(`Prompt '${title}' not found.`);
        return;
    }

    const modelSelector = loadModelSelector(textEditor.document);
    logger.trace(`Model selector: ${JSON.stringify(modelSelector)}`);
    const [model] = await vscode.lm.selectChatModels(modelSelector);
    if (!model) {
        vscode.window.showErrorMessage(`Model not found (vendor: ${modelSelector.vendor}, family: ${modelSelector.family}).`);
        return;
    }
    logger.trace(`Selected model: ${model.id}`);

    let chatResponse: vscode.LanguageModelChatResponse | undefined;

    const selection = textEditor.selection;
    const text = textEditor.document.getText(selection);
    const messages = [
        vscode.LanguageModelChatMessage.User(loadSystemPrompt(textEditor.document).join('\n')),
        vscode.LanguageModelChatMessage.User(`The result should be valid ${textEditor.document.languageId} code.`),
        ...prompt.prompt.map(message => vscode.LanguageModelChatMessage.User(message)),
        vscode.LanguageModelChatMessage.User(text),
    ];

    logger.trace(`Messages sent to model: ${JSON.stringify(messages)}`);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: 'Running...' });
            chatResponse = await model.sendRequest(
                messages,
                {},
                new vscode.CancellationTokenSource().token
            );
        } catch (err) {
            if (err instanceof vscode.LanguageModelError) {
                console.log(err.message, err.code, err.cause);
                logger.error(`LanguageModelError: ${err.message}, Code: ${err.code}, Cause: ${err.cause}`);
            } else {
                logger.error(`Unexpected error: ${err}`);
                throw err;
            }
            return;
        }

        let responseText = '';

        try {
            progress.report({ message: 'Applying...' });
            for await (const fragment of chatResponse.text) {
                responseText += fragment;
            }

            logger.trace(`Response from model: ${responseText}`);

            let value = responseText;
            let lines = responseText.split('\n');
            const firstIndex = lines.findIndex(line => line.trim().startsWith('```'));
            if (firstIndex !== -1) {
                const endIndex = lines.findIndex((line, index) => index > firstIndex && line.trim().startsWith('```'));
                if (endIndex !== -1) {
                    lines = lines.slice(firstIndex + 1, endIndex);
                    value = lines.join('\n');
                }
            }

            await textEditor.insertSnippet(new vscode.SnippetString(value), selection);
        } catch (err) {
            const errorMessage = `Error: ${(<Error>err).message}`;
            vscode.window.showErrorMessage(errorMessage);
            logger.error(errorMessage);
        }
    });
}

function loadPrompts(textDocument: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('myprompts', textDocument);
    const commands = new Map<string, PromptCommand>();
    const merge = (value?: PromptCommand[]) => {
        if (value) {
            for (const command of value) {
                const languages = command.languages || ['*'];
                if (languages.includes('*') || languages.includes(textDocument.languageId)) {
                    commands.set(command.title, command);
                }
            }
        }
    };
    const inspect = config.inspect<PromptCommand[]>('commands');
    merge(inspect?.workspaceFolderLanguageValue);
    merge(inspect?.workspaceFolderValue);
    merge(inspect?.workspaceLanguageValue);
    merge(inspect?.workspaceValue);
    merge(inspect?.globalLanguageValue);
    merge(inspect?.globalValue);
    merge(inspect?.defaultLanguageValue);
    merge(inspect?.defaultValue);
    return commands;
}

function loadModelSelector(textDocument: vscode.TextDocument): Pick<vscode.LanguageModelChatSelector, 'family' | 'vendor'> {
    const config = vscode.workspace.getConfiguration('myprompts', textDocument);
    return config.get<vscode.LanguageModelChatSelector>('model')!;
}

function loadSystemPrompt(textDocument: vscode.TextDocument): string[] {
    const config = vscode.workspace.getConfiguration('myprompts', textDocument);
    return config.get<string[]>('systemPrompt')!;
}
