/**
 * Plugin Registry
 * 
 * Central registry for managing all plugins in the system.
 */

import { IPlugin, PluginRegistration, PluginContext } from "./types";

class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map();
  private context: PluginContext | null = null;

  /**
   * Register a plugin in the registry
   */
  register(plugin: IPlugin): void {
    if (this.plugins.has(plugin.metadata.name)) {
      console.warn(
        `Plugin ${plugin.metadata.name} is already registered. Overwriting...`
      );
    }

    const registration: PluginRegistration = {
      plugin,
      enabled: true,
      loadedAt: new Date(),
    };

    this.plugins.set(plugin.metadata.name, registration);

    // Initialize plugin if context is available
    if (this.context && plugin.init) {
      const initResult = plugin.init(this.context);
      if (initResult instanceof Promise) {
        initResult.catch((error) => {
          console.error(`Failed to initialize plugin ${plugin.metadata.name}:`, error);
        });
      }
    }

    console.log(`Plugin registered: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginName: string): void {
    const registration = this.plugins.get(pluginName);
    if (registration) {
      if (registration.plugin.cleanup) {
        const cleanupResult = registration.plugin.cleanup();
        if (cleanupResult instanceof Promise) {
          cleanupResult.catch((error: unknown) => {
            console.error(`Failed to cleanup plugin ${pluginName}:`, error);
          });
        }
      }
      this.plugins.delete(pluginName);
      console.log(`Plugin unregistered: ${pluginName}`);
    }
  }

  /**
   * Get a plugin by name
   */
  get(pluginName: string): IPlugin | undefined {
    const registration = this.plugins.get(pluginName);
    return registration?.enabled ? registration.plugin : undefined;
  }

  /**
   * Get a plugin function by function name
   */
  getPluginByFunction(functionName: string): { plugin: IPlugin; functionName: string } | null {
    for (const registration of this.plugins.values()) {
      if (!registration.enabled) continue;

      const hasFunction = registration.plugin.functions.some(
        (fn) => fn.name === functionName
      );
      if (hasFunction) {
        return { plugin: registration.plugin, functionName };
      }
    }
    return null;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values())
      .filter((reg) => reg.enabled)
      .map((reg) => reg.plugin);
  }

  /**
   * Get all functions from all enabled plugins
   */
  getAllFunctions(): Array<{ plugin: string; function: unknown }> {
    const functions: Array<{ plugin: string; function: unknown }> = [];

    for (const registration of this.plugins.values()) {
      if (!registration.enabled) continue;

      for (const fn of registration.plugin.functions) {
        functions.push({
          plugin: registration.plugin.metadata.name,
          function: {
            type: "function",
            function: {
              name: fn.name,
              description: fn.description,
              parameters: fn.parameters,
            },
          },
        });
      }
    }

    return functions;
  }

  /**
   * Set the execution context for plugins
   */
  setContext(context: PluginContext): void {
    this.context = context;

    // Initialize all plugins with the new context
    for (const registration of this.plugins.values()) {
      if (registration.plugin.init) {
        const initResult = registration.plugin.init(context);
        if (initResult instanceof Promise) {
          initResult.catch((error) => {
            console.error(
              `Failed to initialize plugin ${registration.plugin.metadata.name}:`,
              error
            );
          });
        }
      }
    }
  }

  /**
   * Get the current context
   */
  getContext(): PluginContext | null {
    return this.context;
  }

  /**
   * Enable/disable a plugin
   */
  setEnabled(pluginName: string, enabled: boolean): void {
    const registration = this.plugins.get(pluginName);
    if (registration) {
      registration.enabled = enabled;
      console.log(`Plugin ${pluginName} ${enabled ? "enabled" : "disabled"}`);
    }
  }

  /**
   * Check if a plugin is registered
   */
  has(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Get plugin count
   */
  count(): number {
    return this.plugins.size;
  }
}

// Export singleton instance
export const pluginRegistry = new PluginRegistry();

