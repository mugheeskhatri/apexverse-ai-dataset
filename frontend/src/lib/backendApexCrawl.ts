import fs from "fs";
import path from "path";

export const defaultApexCrawlBaseUrl = "http://127.0.0.1:8050";

const localEnvFiles = [".env.local", "env.local"];

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function readLocalEnvValue(envName: string) {
  for (const fileName of localEnvFiles) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (parsed?.key === envName && parsed.value) {
        return parsed.value;
      }
    }
  }

  return null;
}

export function getApexCrawlBaseUrl() {
  const configuredBaseUrl =
    process.env.APEXC_RAWL_API_BASE_URL ??
    process.env.NEXT_PUBLIC_EXTRACTOR_API_BASE_URL ??
    readLocalEnvValue("APEXCRAWL_API_BASE_URL") ??
    readLocalEnvValue("NEXT_PUBLIC_EXTRACTOR_API_BASE_URL") ??
    defaultApexCrawlBaseUrl;

  return configuredBaseUrl.replace(/\/$/, "");
}

export function getApexCrawlConfigError(endpointPath: string) {
  return `ApexCrawl was reached at the wrong target. Expected ${endpointPath} on ${getApexCrawlBaseUrl()}. Start ApexCrawl on ${defaultApexCrawlBaseUrl} or set APEXC_RAWL_API_BASE_URL on the Next.js server.`;
}

export function buildApexCrawlUrl(path: string) {
  return `${getApexCrawlBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
