#!/usr/bin/env node
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

// Recursively remove directory
async function rimraf(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await rimraf(fullPath);
      } else {
        await fsPromises.unlink(fullPath);
      }
    }),
  );
  await fsPromises.rmdir(dir);
}

// Recursively copy directory
async function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = await fsPromises.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        const content = await fsPromises.readFile(srcPath);
        await fsPromises.writeFile(destPath, content);
        await fsPromises.unlink(srcPath);
      }
    }),
  );
}

// Recursively find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) {
    return files;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Fixes imports to main flightctl API types in imagebuilder TypeScript files.
 * The imports are in the form of:
 * import type { openapi_yaml_components_schemas_ObjectMeta } from './openapi_yaml_components_schemas_ObjectMeta';
 *
 * The fixes make the file valid by appliying the following changes:
 * 1. Removing the "openapi_yaml_components_schemas_" prefix from all type names
 * 2. Updating import paths from './openapi_yaml_components_schemas_X' to '../../models/X'
 *
 * @param {string} modelsDir - Directory containing TypeScript files to fix
 */
async function fixImagebuilderImports(modelsDir) {
  const files = findTsFiles(modelsDir);

  await Promise.all(
    files.map(async (filePath) => {
      let content = await fsPromises.readFile(filePath, 'utf8');
      const originalContent = content;

      // Replace import paths: './openapi_yaml_components_schemas_X' -> '../../models/X'
      content = content.replace(
        /from\s+['"]\.\/openapi_yaml_components_schemas_([A-Za-z][A-Za-z0-9]*)['"]/g,
        "from '../../models/$1'",
      );

      // Remove the prefix from all type names: 'openapi_yaml_components_schemas_X' -> 'X'
      content = content.replace(/\bopenapi_yaml_components_schemas_([A-Za-z][A-Za-z0-9]*)\b/g, '$1');

      // Only write if content changed
      if (content !== originalContent) {
        await fsPromises.writeFile(filePath, content, 'utf8');
      }
    }),
  );
}

module.exports = {
  rimraf,
  copyDir,
  fixImagebuilderImports,
};
