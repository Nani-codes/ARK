/**
 * Create Twilio Content templates and assign ContentSids to cms/src/config/twilio-template-sids.json
 *
 * Usage:
 *   cd cms && cp .env.example .env   # add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN
 *   npx tsx scripts/sync-twilio-templates.ts --dry-run
 *   npx tsx scripts/sync-twilio-templates.ts --create
 *   npx tsx scripts/sync-twilio-templates.ts --create --submit-whatsapp
 */
import fs from 'fs';
import path from 'path';

import { WHATSAPP_TEMPLATE_DEFINITIONS } from '../src/data/whatsapp-template-definitions';

const REGISTRY_PATH = path.join(__dirname, '../src/config/twilio-template-sids.json');

type RegistryEntry = {
  contentSid: string;
  friendlyName: string;
  category: string;
};

type Registry = Record<string, RegistryEntry>;

function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function authHeader() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) {
    throw new Error('Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in cms/.env');
  }
  return {
    accountSid,
    authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
  };
}

async function createContentTemplate(
  authorization: string,
  definition: (typeof WHATSAPP_TEMPLATE_DEFINITIONS)[number]
) {
  const res = await fetch('https://content.twilio.com/v1/Content', {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      friendly_name: definition.friendlyName,
      language: 'en',
      variables: definition.variables,
      types: {
        'twilio/text': {
          body: definition.body,
        },
      },
    }),
  });

  const json = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) {
    throw new Error(`Create ${definition.friendlyName} failed: ${json.message ?? res.status}`);
  }
  return json.sid!;
}

async function submitWhatsAppApproval(authorization: string, contentSid: string, name: string, category: string) {
  const res = await fetch(
    `https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests/whatsapp`,
    {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, category }),
    }
  );

  const json = (await res.json()) as { status?: string; message?: string };
  if (!res.ok) {
    console.warn(`  WhatsApp approval submit warning for ${contentSid}: ${json.message ?? res.status}`);
    return;
  }
  console.log(`  WhatsApp approval submitted: ${json.status ?? 'pending'}`);
}

function loadRegistry(): Registry {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) as Registry;
}

function saveRegistry(registry: Registry) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
}

function printEnvBlock(registry: Registry) {
  console.log('\n# Paste into cms/.env (overrides JSON registry when set):\n');
  for (const def of WHATSAPP_TEMPLATE_DEFINITIONS) {
    const sid = registry[def.event]?.contentSid;
    const envKey = `TWILIO_TEMPLATE_${def.event.toUpperCase()}`;
    console.log(`${envKey}=${sid ?? ''}`);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run') || !args.has('--create');
  const submitWhatsApp = args.has('--submit-whatsapp');

  loadEnvFile();
  const registry = loadRegistry();

  console.log(`Mode: ${dryRun ? 'dry-run (pass --create to provision)' : 'create'}`);
  console.log(`Registry: ${REGISTRY_PATH}\n`);

  if (dryRun) {
    for (const def of WHATSAPP_TEMPLATE_DEFINITIONS) {
      const entry = registry[def.event];
      const sid = entry?.contentSid?.trim();
      console.log(`[${def.event}]`);
      console.log(`  friendlyName: ${def.friendlyName}`);
      console.log(`  category:     ${def.category}`);
      console.log(`  contentSid:   ${sid || '(missing — run --create)'}`);
      console.log(`  body:         ${def.body}`);
      console.log(`  variables:    ${JSON.stringify(def.variables)}`);
      console.log('');
    }
    printEnvBlock(registry);
    return;
  }

  const { authorization } = authHeader();

  for (const def of WHATSAPP_TEMPLATE_DEFINITIONS) {
    const existing = registry[def.event]?.contentSid?.trim();
    if (existing) {
      console.log(`✓ ${def.event} already assigned ${existing}`);
      continue;
    }

    console.log(`Creating ${def.friendlyName}...`);
    const contentSid = await createContentTemplate(authorization, def);
    registry[def.event] = {
      contentSid,
      friendlyName: def.friendlyName,
      category: def.category,
    };
    console.log(`  Created ${contentSid}`);

    if (submitWhatsApp) {
      await submitWhatsAppApproval(authorization, contentSid, def.friendlyName, def.category);
    }
  }

  saveRegistry(registry);
  console.log(`\nSaved registry → ${REGISTRY_PATH}`);
  printEnvBlock(registry);
  console.log('\nNext: restart Strapi. Templates must be WhatsApp-approved before messages deliver in production.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
