#!/usr/bin/env node

import { createPrivateKey, createSign } from "node:crypto";
import { readFileSync } from "node:fs";

function printUsage() {
  console.error(
    [
      "Usage:",
      "  node scripts/generate_apple_client_secret.mjs \\",
      "    --team-id <APPLE_TEAM_ID> \\",
      "    --key-id <APPLE_KEY_ID> \\",
      "    --client-id <APPLE_CLIENT_ID> \\",
      "    --p8 <PATH_TO_AUTHKEY_P8> \\",
      "    [--expires-days 180]",
    ].join("\n"),
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }
  return args;
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const teamId = args["team-id"];
  const keyId = args["key-id"];
  const clientId = args["client-id"];
  const p8Path = args.p8;
  const expiresDays = Number.parseInt(String(args["expires-days"] ?? "180"), 10);

  if (!teamId || !keyId || !clientId || !p8Path || Number.isNaN(expiresDays)) {
    printUsage();
    process.exit(1);
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresDays * 24 * 60 * 60;

  const header = {
    alg: "ES256",
    kid: keyId,
  };

  const payload = {
    iss: teamId,
    iat: issuedAt,
    exp: expiresAt,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKey = createPrivateKey(readFileSync(p8Path, "utf8"));
  const signer = createSign("sha256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign({
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  const encodedSignature = base64UrlEncode(signature);
  const jwt = `${signingInput}.${encodedSignature}`;

  console.log(jwt);
}

main();
