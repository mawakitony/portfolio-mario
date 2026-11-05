/** Au plus 60 secondes côté visiteur, avec invalidation immédiate après publication. */
export const publicContentCache = {
  stale: 60,
  revalidate: 60,
  expire: 540,
};
