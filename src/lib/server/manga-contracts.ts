/** Shape returned by `/listas`; reused when falling back through `/series-locales` o Mangadex. */
export type HomeMangaListaItem = {
  serie?: {
    id: string;
    titulo: string;
    portadaUrl: string | null;
    descripcion: string | null;
  } | null;
};

/** `title` aparece en home Mangadex (varios railes); el backend clasico suele omitirlo. */
export type HomeMangaListaSection = {
  title?: string;
  items: HomeMangaListaItem[];
};

export type HomeMangaListasPayload = HomeMangaListaSection[];

/** Respuesta de `/series-locales/generos` y del respaldo agregado. */
export type MangaGenreApiRow = {
  nombre: string;
  total: number;
  portadaUrl: string | null;
};
