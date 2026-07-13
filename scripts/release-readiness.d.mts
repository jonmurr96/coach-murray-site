export type ReleaseCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  requiredIn: string[];
};

export const REQUIRED_TABLES: string[];
export const REQUIRED_PRIVATE_ROUTES: string[];

export function parseEnv(source: string): Record<string, string>;
export function isConfigured(value: string | undefined): boolean;
export function senderDomain(value: string | undefined): string;
export function authEmailTemplatesEnabled(source: string | undefined): boolean;
export function expectedCheckoutRedirect(origin?: string): string;
export function paymentLinkIsProductionReady(
  paymentLink: unknown,
  origin?: string
): boolean;
export function extractStripeUrls(html: string): string[];
export function releaseSummary(
  checks: ReleaseCheck[],
  phase: string
): { ready: boolean; blocking: ReleaseCheck[] };
export function runReadiness(options: {
  env: Record<string, string>;
  phase?: string;
  resolveNs?: (domain: string) => Promise<string[]>;
}): Promise<ReleaseCheck[]>;
