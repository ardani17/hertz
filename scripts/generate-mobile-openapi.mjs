#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const apiReference = readFileSync(join(process.cwd(), 'docs/mobile/api-reference.md'), 'utf8');
const endpoints = [...apiReference.matchAll(/### (GET|POST|PATCH|DELETE) `([^`]+)`/g)].map((match) => ({
  method: match[1],
  path: match[2].replace('$BASE', '').replace('/api/mobile/v1', '/api/mobile/v1'),
}));

const yaml = [
  'openapi: 3.1.0',
  'info:',
  '  title: Hertz Mobile API',
  '  version: 1.0.0',
  '  description: Generated from docs/mobile/api-reference.md',
  'servers:',
  '  - url: https://hertz.cloudnexify.com',
  'paths:',
  ...endpoints.flatMap(({ method, path }) => [
    `  ${path}:`,
    `    ${method.toLowerCase()}:`,
    '      responses:',
    "        '200':",
    '          description: Success envelope',
  ]),
  '',
].join('\n');

writeFileSync(join(process.cwd(), 'docs/mobile/openapi.yaml'), yaml);
console.log(`Generated docs/mobile/openapi.yaml with ${endpoints.length} operations`);
