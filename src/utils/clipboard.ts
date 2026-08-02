/**
 * Copies text to the clipboard with a fallback for insecure origins.
 *
 * `navigator.clipboard` is only defined in secure contexts (https:// or
 * localhost). On a plain http:// deployment it is `undefined`, so calling it
 * directly threw a TypeError and the "Copied!" confirmation never appeared.
 *
 * @returns true when the text was copied, false when every strategy failed.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, falling back to execCommand:', err);
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (err) {
    console.warn('Unable to copy to clipboard:', err);
    return false;
  }
}
