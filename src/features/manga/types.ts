export type Manga = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  genres: string[];
};

export type MangaGenre = {
  name: string;
  total: number;
  coverUrl: string | null;
};

export type MangaChapter = {
  id: number;
  chapterNumber: number;
  title: string | null;
  totalPages: number;
};

export type MangaDetail = {
  id: string;
  title: string;
  description: string;
  author: string;
  coverUrl: string;
  genres: string[];
  status: string;
  score: number | null;
  chapters: MangaChapter[];
};
