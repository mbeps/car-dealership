/**
 * Main database module - exports TypeORM functionality.
 *
 * This module provides lazy-loaded services and utilities to avoid
 * circular dependency issues with Next.js/Turbopack.
 *
 * IMPORTANT: Do not import entities directly from this module.
 * Import services instead, which handle entity access internally.
 */

// Export services (these are safe to import)
export * from "./services";

// Export utilities
export * from "./utils";

// DO NOT export data-source, repositories, or entities directly
// to avoid circular dependency issues during Next.js build
