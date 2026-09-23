#!/usr/bin/env node
// Generates seeds/03_admin.sql with a PBKDF2 hashed admin account.
// Usage: ADMIN_EMAIL=.. ADMIN_PASSWORD=.. node seeds/make-admin.mjs
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const email = (process.env.ADMIN_EMAIL || 'admin@discoveruganda.local').toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'ChangeMe!2026';
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, 100000, 32, 'sha256');
const stored = `pbkdf2$100000$${salt.toString('hex')}$${hash.toString('hex')}`;
const sql = `INSERT OR REPLACE INTO users (email,name,password_hash,role) VALUES ('${email}','Site Admin','${stored}','admin');\n`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '03_admin.sql'), sql);
console.log(`Admin seed written for ${email}`);
