// FIFA highlights play in FIFA's Embeddable Player (evp.fifa.com), which only
// works with an authorised FIFA *partner name* in the URL — without one the
// embed just shows a "Welcome to FIFA Embeddable Player" screen. We don't have a
// partner name, so by default the EN button opens the highlight on fifa.com in a
// new tab instead of embedding it.
//
// To switch to a true in-app embed: set FIFA_PARTNER to your partner name and
// confirm the evp.fifa.com URL layout below (it couldn't be verified here
// because fifa.com is blocked by this environment's egress allowlist).
export const FIFA_PARTNER = '';

export const canEmbedFifa = FIFA_PARTNER.length > 0;

export function fifaWatchUrl(watchId: string): string {
  return 'https://www.fifa.com/en/watch/' + watchId;
}

export function fifaEmbedSrc(watchId: string): string {
  return 'https://evp.fifa.com/' + encodeURIComponent(FIFA_PARTNER) +
    '?contentId=' + encodeURIComponent(watchId);
}
