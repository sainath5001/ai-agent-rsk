/**
 * Plugin Framework Types
 * 
 * This file defines the core types and interfaces for the Rootstock AI Agent plugin system.
 */

/**
 * Plugin metadata information
 */
export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author?: string;
    repository?: string;
}

/**
 * Function parameter definition for AI tool functions
 */
export interface PluginFunctionParameter {
    type: string;
    description: string;
    enum?: string[];
}

/**
 * Plugin function definition (what the AI can call)
 */
export interface PluginFunction {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, PluginFunctionParameter>;
        required: string[];
    };
}

/**
 * Plugin execution context
 */
export interface PluginContext {
  address?: string;
  isConnected: boolean;
  config: unknown; // Wagmi config
  [key: string]: unknown; // Allow additional context
}

/**
 * Plugin execution result
 */
export interface PluginResult {
  success: boolean;
  data?: unknown;
  error?: string;
  displayContent?: React.ReactNode; // Optional: Custom React component for display (client-side only)
}

/**
 * Base plugin interface that all plugins must implement
 */
export interface IPlugin {
    /**
     * Plugin metadata
     */
    metadata: PluginMetadata;

    /**
     * Functions that this plugin provides to the AI
     */
    functions: PluginFunction[];

    /**
     * Initialize the plugin (called when plugin is loaded)
     */
    init?(context: PluginContext): Promise<void> | void;

    /**
     * Execute a function provided by this plugin
     */
  execute(
    functionName: string,
    args: Record<string, unknown>,
    context: PluginContext
  ): Promise<PluginResult>;

    /**
     * Cleanup when plugin is unloaded
     */
    cleanup?(): Promise<void> | void;
}

/**
 * Plugin registration information
 */
export interface PluginRegistration {
    plugin: IPlugin;
    enabled: boolean;
    loadedAt: Date;
}

