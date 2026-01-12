/**
 * Plugin System Entry Point
 * 
 * Initializes and exports the plugin system.
 */

import { loadPlugins } from "./loader";
import { transferPlugin } from "./builtin/transfer";
import { balancePlugin } from "./builtin/balance";

// Load built-in plugins
export async function initializePlugins() {
  await loadPlugins([transferPlugin, balancePlugin]);
}

// Export plugin system components
export { pluginRegistry } from "./registry";
export { loadPlugins, loadPlugin, unloadPlugin, reloadPlugin } from "./loader";
export type {
  IPlugin,
  PluginMetadata,
  PluginFunction,
  PluginContext,
  PluginResult,
  PluginRegistration,
} from "./types";

