/**
 * PHP Doc Extended - VSCode Extension Entry Point
 *
 * Provides enhanced PHPDoc type highlighting using semantic tokens
 * powered by PHPStan's phpdoc-parser.
 */

import * as vscode from 'vscode';
import { PhpDocSemanticTokensProvider } from './tokenProvider';

let outputChannel: vscode.OutputChannel;

/**
 * Extension activation
 * Called when the extension is activated (when a PHP file is opened)
 */
export function activate(context: vscode.ExtensionContext): void {
  // Create output channel for debugging
  outputChannel = vscode.window.createOutputChannel('PHP Doc Extended');
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine('='.repeat(80));
  outputChannel.appendLine('PHP Doc Extended: Extension activating...');
  outputChannel.appendLine(`Activation Time: ${new Date().toISOString()}`);
  outputChannel.appendLine(`VSCode Version: ${vscode.version}`);
  outputChannel.appendLine('='.repeat(80));

  try {
    // Create the semantic token provider
    const tokenProvider = new PhpDocSemanticTokensProvider(outputChannel);

    // Register the semantic token provider for PHP files
    const selector: vscode.DocumentSelector = { language: 'php', scheme: 'file' };

    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
      selector,
      tokenProvider,
      tokenProvider.getLegend()
    );

    // Add to subscriptions so it's disposed when extension deactivates
    context.subscriptions.push(provider);

    outputChannel.appendLine('✅ Semantic token provider registered successfully');
    outputChannel.appendLine(`   Token Types: ${tokenProvider.getLegend().tokenTypes.join(', ')}`);
    outputChannel.appendLine(`   Token Modifiers: ${tokenProvider.getLegend().tokenModifiers.join(', ')}`);
    outputChannel.appendLine('');
    outputChannel.appendLine('💡 Tip: Open a PHP file to see semantic token provider in action');
    outputChannel.appendLine('💡 Tip: Use Developer: Inspect Editor Tokens and Scopes to verify');

    // Show welcome message
    vscode.window.showInformationMessage(
      'PHP Doc Extended: Semantic token provider active! Check output panel for debug info.',
      'Show Output'
    ).then(selection => {
      if (selection === 'Show Output') {
        outputChannel.show();
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`❌ Failed to activate extension: ${errorMsg}`);
    if (error instanceof Error && error.stack) {
      outputChannel.appendLine(error.stack);
    }

    vscode.window.showErrorMessage(
      `PHP Doc Extended: Failed to activate. ${errorMsg}`
    );
  }
}

/**
 * Extension deactivation
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  if (outputChannel) {
    outputChannel.appendLine('');
    outputChannel.appendLine('PHP Doc Extended: Extension deactivated');
    outputChannel.appendLine(`Deactivation Time: ${new Date().toISOString()}`);
  }
}
