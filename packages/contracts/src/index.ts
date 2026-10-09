/** Identificador de domínio; os componentes não dependem do formato da TMDB. */
export type MovieId = number;

/** Identificadores dos micro-frontends. */
export type RemoteName = 'catalog' | 'movie' | 'area';

export interface RuntimeConfig {
  remotes: Record<RemoteName, string>;
}

export interface NavigationItem {
  to: string;
  label: string;
}
