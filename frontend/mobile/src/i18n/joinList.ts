/** ["a", "b", "c"] -> "a, b and c"; `and` is the translated joiner (" and "). */
export function joinList(items: readonly string[], and: string): string {
  return items.length <= 2 ? items.join(and) : `${items.slice(0, -1).join(', ')}${and}${items[items.length - 1]}`;
}
