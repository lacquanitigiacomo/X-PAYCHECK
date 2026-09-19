export interface ApiLocation {
  hostname: string;
  origin: string;
}

const LOCAL_API_BASE_URL = 'http://localhost:3001/api/v1';

/**
 * Determina la base URL delle API in base all'host corrente.
 * Gestisce l'esecuzione locale e GitHub Codespaces, dove la porta del
 * frontend (5173) nell'origin generato da Codespaces va sostituita con
 * quella del backend (3001).
 */
export function resolveApiBaseUrl(location: ApiLocation): string {
  if (location.hostname.includes('github.dev')) {
    const codespaceUrl = location.origin.replace('-5173', '-3001');
    return `${codespaceUrl}/api/v1`;
  }
  return LOCAL_API_BASE_URL;
}

/**
 * `window` va letto solo se esiste: i test dei moduli puri girano in ambiente
 * node, e valutarlo qui a import-time rendeva non importabile ogni modulo che
 * usa API_BASE_URL fuori da jsdom.
 */
export const API_BASE_URL =
  typeof window === 'undefined' ? LOCAL_API_BASE_URL : resolveApiBaseUrl(window.location);
