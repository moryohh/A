type CurriculumFile = string | { file: string; label?: string };
type CurriculumTopic = { id?: string; name: string; files: CurriculumFile[] };
type CurriculumChapter = { id?: string; title: string; topics: CurriculumTopic[] };

export type SolveWithMeTopic = {
  id: string;
  subject: string;
  chapterNumber: number;
  lessonNumber: number;
  title: string;
  files: string[];
};

const curriculumBySubject: Record<string, string> = {
  mathematics: '/solve-with-me/curriculum.json',
  math: '/solve-with-me/curriculum.json',
  physics: '/solve-with-me/physics-curriculum.json',
  chemistry: '/solve-with-me/chemistry-curriculum.json',
};

const catalogCache = new Map<string, Promise<SolveWithMeTopic[]>>();
const basename = (value: string) => String(value || '').split('/').pop() || '';
const fileName = (value: CurriculumFile) => typeof value === 'string' ? value : value.file;

/**
 * Builds the online-class topic picker from the real Solve With Me curriculum.
 * A topic is admitted only when at least one of its exercise files exists in
 * the deployed board snapshot and its JSON parsed to non-empty content during
 * the build. This avoids phantom video/lecture titles and hundreds of runtime
 * probes against Cloudflare.
 */
export function fetchSolveWithMeTopics(subjectId: string): Promise<SolveWithMeTopic[]> {
  const subject = String(subjectId || '').toLowerCase().trim();
  const curriculumUrl = curriculumBySubject[subject];
  if (!curriculumUrl) return Promise.resolve([]);
  if (catalogCache.has(subject)) return catalogCache.get(subject)!;

  const request = Promise.all([
    fetch(curriculumUrl).then((response) => {
      if (!response.ok) throw new Error(`Solve With Me curriculum HTTP ${response.status}`);
      return response.json() as Promise<CurriculumChapter[]>;
    }),
    fetch('/solve-with-me/catalog-availability.json').then((response) => {
      if (!response.ok) throw new Error(`Solve With Me availability HTTP ${response.status}`);
      return response.json() as Promise<{ files?: string[] }>;
    }),
  ]).then(([chapters, availability]) => {
    const verified = new Set<string>((availability.files || []).map(basename));

    return chapters.flatMap((chapter, chapterIndex) => {
      const chapterNumber = Number(String(chapter.id || '').match(/(\d+)/)?.[1]) || chapterIndex + 1;
      return (chapter.topics || []).flatMap((topic, topicIndex) => {
        const files = (topic.files || []).map(fileName).filter((file) => verified.has(basename(file)));
        if (!files.length) return [];
        return [{
          id: `solve-${subject}-ch${chapterNumber}-topic${topicIndex + 1}`,
          subject,
          chapterNumber,
          lessonNumber: topicIndex + 1,
          title: topic.name,
          files,
        }];
      });
    });
  }).catch((error) => {
    catalogCache.delete(subject);
    throw error;
  });

  catalogCache.set(subject, request);
  return request;
}
