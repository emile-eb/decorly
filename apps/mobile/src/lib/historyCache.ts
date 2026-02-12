type CacheState = {
  items: any[];
  thumbs: Record<string, string>;
  lastLoaded: number | null;
};

const state: CacheState = {
  items: [],
  thumbs: {},
  lastLoaded: null
};

export function getHistoryCache() {
  return state;
}

export function setHistoryCache(items: any[], thumbs: Record<string, string>) {
  state.items = items;
  state.thumbs = thumbs;
  state.lastLoaded = Date.now();
}

export function updateHistoryThumbs(nextThumbs: Record<string, string>) {
  state.thumbs = { ...state.thumbs, ...nextThumbs };
  state.lastLoaded = state.lastLoaded ?? Date.now();
}
