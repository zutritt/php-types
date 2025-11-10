/**
 * PHP Doc Extended - VSCode Extension Entry Point
 *
 * Provides enhanced PHPDoc type highlighting using semantic tokens
 * powered by PHPStan's phpdoc-parser.
 */

import * as vscode from 'vscode';
import { PhpDocSemanticTokensProvider } from './tokenProvider';

/**
 * Extension activation
 * Called when the extension is activated (when a PHP file is opened)
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('PHP Doc Extended: Extension activating...');

  try {
    // Create the semantic token provider
    const tokenProvider = new PhpDocSemanticTokensProvider();

    // Register the semantic token provider for PHP files
    const selector: vscode.DocumentSelector = { language: 'php', scheme: 'file' };

    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
      selector,
      tokenProvider,
      tokenProvider.getLegend()
    );

    // Add to subscriptions so it's disposed when extension deactivates
    context.subscriptions.push(provider);

    console.log('PHP Doc Extended: Semantic token provider registered successfully');
  } catch (error) {
    console.error('PHP Doc Extended: Failed to activate extension:', error);
    vscode.window.showErrorMessage(
      `PHP Doc Extended: Failed to activate. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Extension deactivation
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  console.log('PHP Doc Extended: Extension deactivated');
}
