#!/usr/bin/env node
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const OpenAPI = require('openapi-typescript-codegen');
const YAML = require('js-yaml');

const { rimraf, copyDir, fixImagebuilderImports } = require('./openapi-utils');

const baseSwaggerUrl = 'https://raw.githubusercontent.com/flightctl/flightctl/main/api/v1beta1';

const processJsonAPI = (jsonString) => {
  const json = YAML.load(jsonString);
  if (json.components) {
    Object.keys(json.components.schemas).forEach((key) => {
      const schema = json.components.schemas[key];
      if (schema && typeof schema.type === 'undefined') {
        schema.type = 'object';
      }
    });
  }
  return json;
};

// Generate types from OpenAPI spec
async function generateTypes(mode) {
  const config = {
    main: {
      swaggerUrl: `${baseSwaggerUrl}/openapi.yaml`,
      output: path.resolve(__dirname, '../tmp-types'),
      finalDir: path.resolve(__dirname, '../models'),
    },
    imagebuilder: {
      swaggerUrl: `${baseSwaggerUrl}/imagebuilder/openapi.yaml`,
      output: path.resolve(__dirname, '../tmp-imagebuilder-types'),
      finalDir: path.resolve(__dirname, '../imagebuilder/models'),
    },
  };

  if (!config[mode]) {
    throw new Error(`Unknown mode: ${mode}. Use 'main' or 'imagebuilder'`);
  }

  const { swaggerUrl, output, finalDir } = config[mode];

  console.log(`Fetching ${mode} OpenAPI spec from ${swaggerUrl}...`);
  const response = await fetch(swaggerUrl);
  const data = await response.text();

  console.log(`Generating ${mode} types...`);
  await OpenAPI.generate({
    input: processJsonAPI(data),
    output,
    exportCore: false,
    exportServices: false,
    exportModels: true,
    exportSchemas: false,
    indent: '2',
  });

  if (mode === 'main') {
    // Copy the flightctl API types to their final location
    await rimraf(finalDir);
    await copyDir(output, path.resolve(__dirname, '..'));
    await rimraf(output);
  } else {
    // Image builder types need to be fixed before they can be moved to their final location
    await rimraf(finalDir);
    const modelsDir = path.join(output, 'models');
    if (fs.existsSync(modelsDir)) {
      await copyDir(modelsDir, finalDir);
    }
    console.log(`Fixing ${mode} imports...`);
    await fixImagebuilderImports(finalDir);

    // Copy the generated index.ts to imagebuilder/index.ts
    const indexPath = path.join(output, 'index.ts');
    if (fs.existsSync(indexPath)) {
      const imagebuilderDir = path.resolve(__dirname, '../imagebuilder');
      if (!fs.existsSync(imagebuilderDir)) {
        fs.mkdirSync(imagebuilderDir, { recursive: true });
      }
      await fsPromises.copyFile(indexPath, path.join(imagebuilderDir, 'index.ts'));
    }
    await rimraf(output);
  }
}

async function main() {
  try {
    const rootDir = path.resolve(__dirname, '..');

    // Clean up existing directories
    console.log('Cleaning up existing directories...');
    await Promise.all([
      rimraf(path.join(rootDir, 'models')),
      rimraf(path.join(rootDir, 'imagebuilder')),
      rimraf(path.join(rootDir, 'tmp-types')),
      rimraf(path.join(rootDir, 'tmp-imagebuilder-types')),
    ]);

    console.log('Generating types...');
    await generateTypes('main');
    await generateTypes('imagebuilder');

    console.log('✅ Type generation complete!');
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

void main();
