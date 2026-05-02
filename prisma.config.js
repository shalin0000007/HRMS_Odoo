// Prisma 7 config — correct API (datasource singular, no nesting)
//
// Type: defineConfig({ datasource?: { url?: string } })
// NOT:  datasources.db.url  ← WRONG, silently ignored

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
