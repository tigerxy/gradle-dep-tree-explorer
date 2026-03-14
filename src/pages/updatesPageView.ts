export function updateMessageClass(anyForced: boolean): string {
  return anyForced ? "message is-warning" : "message is-light";
}

export function favoriteButtonClass(isFavorite: boolean): string {
  return `button is-ghost ${isFavorite ? "fav" : ""}`;
}

export function favoriteIconClass(isFavorite: boolean): string {
  return isFavorite ? "fas fa-star" : "far fa-star";
}
