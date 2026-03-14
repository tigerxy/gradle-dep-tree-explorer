export type FilterFlags = Uint8Array;

export function createFilterFlags(size: number): FilterFlags {
  return new Uint8Array(size);
}

export function setFilterFlag(flags: FilterFlags, index: number): void {
  flags[index] = 1;
}

export function hasFilterFlag(flags: FilterFlags, index: number): boolean {
  return flags[index] === 1;
}
