
import { IPlugin } from "./types";
import { pluginRegistry } from "./registry";
import { logger } from "@/lib/logger";

export async function loadPlugins(plugins: IPlugin[]): Promise<void> {
  for (const plugin of plugins) {
    try {
      if (!plugin.metadata || !plugin.functions || !plugin.execute) {
        throw new Error(
          `Invalid plugin structure: ${plugin.metadata?.name || "unknown"}`
        );
      }

      pluginRegistry.register(plugin);
    } catch (error) {
      logger.error(`Failed to load plugin:`, error);
    }
  }
}

export async function loadPlugin(plugin: IPlugin): Promise<void> {
  await loadPlugins([plugin]);
}

export function unloadPlugin(pluginName: string): void {
  pluginRegistry.unregister(pluginName);
}

export async function reloadPlugin(plugin: IPlugin): Promise<void> {
  unloadPlugin(plugin.metadata.name);
  await loadPlugin(plugin);
}



