# My Prompts

Enhance your AI-assisted programming experience with custom prompts and configurations.

## Key Features

- Manage and customize prompts for AI-assisted programming vis VS Code Settings
- Configure prompt commands with various actions (quickfix, refactor, extract, etc.)
- Load prompts from different scopes (workspace, global, etc.)
- Select and configure language models for AI assistance

## Usage

- Access prompts by running `My Prompts: Edit` from the command palette
- Utilize prompts via code actions
- Add custom prompts as code actions for quick and easy access

## Configuration

### Commands

Add the following settings to your `settings.json` file:

```json
{
    "myprompts.commands": [
        {
            "title": "Convert from JS to TS",
            "prompt": ["Convert the selected code from JavaScript to TypeScript"],
            "codeAction": "rewrite"
        }
    ]
}
```

You can configure prompts at any level you prefer. Prompts will be merged with more specific scopes taking precedence.

### Model

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