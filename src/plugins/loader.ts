/**
 * Plugin Loader
 * 
 * Handles loading and initializing plugins from various sources.
 */

import { IPlugin } from "./types";
import { pluginRegistry } from "./registry";

/**
 * Load plugins from a directory or module
 */
export async function loadPlugins(plugins: IPlugin[]): Promise<void> {
  for (const plugin of plugins) {
    try {
      // Validate plugin structure
      if (!plugin.metadata || !plugin.functions || !plugin.execute) {
        throw new Error(
          `Invalid plugin structure: ${plugin.metadata?.name || "unknown"}`
        );
      }

      // Register the plugin
      pluginRegistry.register(plugin);
    } catch (error) {
      console.error(`Failed to load plugin:`, error);
    }
  }
}

/**
 * Load a single plugin
 */
export async function loadPlugin(plugin: IPlugin): Promise<void> {
  await loadPlugins([plugin]);
}

/**
 * Unload a plugin
 */
export function unloadPlugin(pluginName: string): void {
  pluginRegistry.unregister(pluginName);
}

/**
 * Reload a plugin
 */
export async function reloadPlugin(plugin: IPlugin): Promise<void> {
  unloadPlugin(plugin.metadata.name);
  await loadPlugin(plugin);
}

