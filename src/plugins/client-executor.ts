/**
 * Client-side Plugin Executor
 * 
 * Executes plugins on the client side with access to wagmi config.
 */

import { IPlugin, PluginContext, PluginResult } from "./types";
import { transferPlugin } from "./builtin/transfer";
import { balancePlugin } from "./builtin/balance";

// Client-side plugin registry
const clientPlugins: Map<string, IPlugin> = new Map();

// Register built-in plugins on client
clientPlugins.set("transfer", transferPlugin);
clientPlugins.set("balance", balancePlugin);

/**
 * Register a plugin on the client side
 */
export function registerClientPlugin(plugin: IPlugin): void {
  clientPlugins.set(plugin.metadata.name, plugin);
}

/**
 * Get a plugin by function name
 */
function getPluginByFunction(functionName: string): IPlugin | null {
  for (const plugin of clientPlugins.values()) {
    const hasFunction = plugin.functions.some((fn) => fn.name === functionName);
    if (hasFunction) {
      return plugin;
    }
  }
  return null;
}

/**
 * Execute a plugin function
 */
export async function executePluginFunction(
  functionName: string,
  args: Record<string, unknown>,
  context: PluginContext
): Promise<PluginResult> {
  const plugin = getPluginByFunction(functionName);

  if (!plugin) {
    return {
      success: false,
      error: `No plugin found for function: ${functionName}`,
    };
  }

  try {
    return await plugin.execute(functionName, args, context);
  } catch (error) {
    console.error(`Plugin execution error for ${functionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Plugin execution failed";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

