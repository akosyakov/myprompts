# My Prompts

My Prompts is a VS Code extension that enables developers to create and manage custom prompts for AI-assisted programming. Define custom prompts that integrate into your workflow for tasks like refactoring, generating code snippets, and automating repetitive tasks.

## Key Features

- Easily manage and customize AI prompts through VS Code settings
- Define actions for prompts such as quickfix, refactor, or extract
- Load prompts from different configuration scopes (workspace, global, etc.)
- Select and configure language models for AI integration
- Use code actions for prompts directly within the editor

## Usage

- **Accessing Prompts:** Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and run the command `My Prompts: Edit` to view and customize prompts.
- **Using Prompts in Code Actions:** Once configured, prompts can be accessed via code actions, triggered by right-clicking the editor and selecting `Code Actions` or using the `Ctrl+.` shortcut.

## Configuration

The following sections explain how to configure the extension for custom prompt commands, models, and more.

### Prompt Commands

Define custom commands by adding the following setting in your `settings.json`:

```json
{
    "myprompts.commands": [
        {
            "title": "Convert from JS to TS",
            "prompt": ["Convert the selected code from JavaScript to TypeScript"]
        }
    ]
}
```

You can define multiple commands, each with its own title and prompt instructions. Commands will merge across different configuration scopes, such as workspace and global settings, with more specific scopes taking precedence.

### Code Actions

You can enhance prompts by integrating them as VS Code code actions. This allows prompts to be invoked directly from the editor, scoped to specific languages:

```json
{
    "myprompts.commands": [
        {
            "title": "Convert from JS to TS",
            "prompt": ["Convert the selected code from JavaScript to TypeScript"],
            "codeAction": "rewrite",
            "languages": [
                "javascript",
                "javascriptreact"
            ]
        }
    ]
}
```

Here, `codeAction` specifies the type of action (e.g., `rewrite`, `refactor`), and languages restricts the action to specific language files. If omitted, the prompt will apply to all languages.

### Snippets

Generated code can be valid VS Code snippets. You can use inline variables to edit them or ask the prompt to add them. For example:

```json
{
    "myprompts.commands": [
        {
            "title": "Create React Component",
            "prompt": ["Generate a React component with the name ${1:ComponentName}"]
        }
    ]
}
```

This allows you to dynamically insert values into the generated code, making it more flexible and customizable.



### Model Settings

The default model is set to `copilot` with the family set to `gpt-4o`. To change the model and family, add the following settings to your `settings.json`:

```json
{
    "myprompts.model": {
        "vendor": "copilot",
        "family": "gpt-4o"
    }
}
```

### System Prompt

Set a system prompt to be used for all interactions. By default, it is configured to generate code and prevent markdown formatting:

```json
{
    "myprompts.systemPrompt": [
        "You are an AI coding assistant. Your task is to rewrite or modify the provided code according to the given instructions.",
        "IMPORTANT: Respond only with the updated code. Do not use markdown or provide any explanations.",
        "Ensure your response maintains the original code's formatting and indentation.",
        "If you need to remove any code, only do so if you are certain it is no longer necessary."
    ]
}
```
