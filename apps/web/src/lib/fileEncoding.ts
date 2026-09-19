const CHUNK_SIZE = 32_768;

export function encodeBytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function readFileAsBase64(file: File): Promise<string> {
  return encodeBytesToBase64(new Uint8Array(await file.arrayBuffer()));
}
