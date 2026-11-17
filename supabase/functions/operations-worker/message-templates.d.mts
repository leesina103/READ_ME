export type MessageSource = { templates: Record<string, string>; revisionId?: string; source?: string; error?: string };
export const MESSAGE_DOCUMENT_ID: string;
export const MESSAGE_DOCUMENT_URL: string;
export function needsConfirmation(reason: string): string;
export function loadMessageTemplates(env: Record<string, string | undefined>, fetcher?: typeof fetch): Promise<MessageSource>;
export function parseMessageTemplates(doc: unknown): MessageSource;
export function renderMessage(source: MessageSource | undefined, key: string | undefined | null, values?: Record<string, string | undefined>): string;
export function bookingMessages(source: MessageSource | undefined, booking: { name: string; interview_slots: { starts_at: string }; management_token?: string; meetUrl?: string }, site: string, now?: number): { reservation: string; reminder: string; thanks: string; values: Record<string, string | undefined> };
export function stageMessages(source: MessageSource | undefined, stage: string, values: Record<string, string | undefined>): { draft: string; nextDraft: string };
