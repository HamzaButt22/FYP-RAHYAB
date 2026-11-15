// The content pack the game's items belong to (RFC-0001). Every item_id a module sends must be listed in
// this pack on the server (the `item` table), or the event is rejected as unknown_item.
//
// Until real content packs exist, the app uses the development pack from database/seed/dev_seed.sql. When
// packs are built, this becomes the id of the pack the phone has downloaded and verified.
export const CONTENT_VERSION = 'dev-2026.11.0';
