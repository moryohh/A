import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const root = resolve('public/solve-with-me');
const dataDir = resolve(root, 'data');
const curriculumFiles = [
  ['mathematics', 'curriculum.json'],
  ['chemistry', 'chemistry-curriculum.json'],
  ['physics', 'physics-curriculum.json'],
];

const records = [];
for (const [subjectId, curriculumName] of curriculumFiles) {
  const curriculum = JSON.parse(await readFile(resolve(root, curriculumName), 'utf8'));
  for (const chapter of curriculum) {
    const chapterNumber = Number(String(chapter.id).match(/(?:ch|chapter)[-_]?(\d+)/i)?.[1]);
    for (let topicIndex = 0; topicIndex < chapter.topics.length; topicIndex += 1) {
      const topic = chapter.topics[topicIndex];
      for (let order = 0; order < topic.files.length; order += 1) {
        const item = topic.files[order];
        const fileName = typeof item === 'string' ? item : item.file;
        const bytes = await readFile(resolve(dataDir, fileName));
        const content = JSON.parse(bytes.toString('utf8'));
        const lessonFromName = Number(fileName.match(/lesson(\d+)/i)?.[1]);
        const pageNumber = Number(fileName.match(/(?:page_|page-?|_page_?)(\d+)/i)?.[1]);
        const lessonNumber = subjectId === 'mathematics' ? topicIndex + 1 : lessonFromName;
        records.push({
          target_id: `solve_with_me:${subjectId}:ch${chapterNumber}:lesson${lessonNumber}:${fileName}`,
          subject_id: subjectId,
          section_id: 'solve_with_me',
          file_name: fileName,
          content,
          content_sha256: createHash('sha256').update(bytes).digest('hex'),
          content_metadata: {
            schema_version: 1,
            chapter_number: chapterNumber,
            lesson_number: lessonNumber,
            topic_number: topicIndex + 1,
            page_number: Number.isFinite(pageNumber) ? pageNumber : null,
            sort_order: order + 1,
            topic_title: topic.name,
            curriculum_file: curriculumName,
          },
        });
      }
    }
  }
}

const diskFiles = (await readdir(dataDir)).filter(file => file.endsWith('.json')).sort();
const manifestFiles = records.map(record => record.file_name).sort();
if (diskFiles.length !== manifestFiles.length || diskFiles.some((file, index) => file !== manifestFiles[index])) {
  throw new Error(`Manifest mismatch: disk=${diskFiles.length}, mapped=${manifestFiles.length}`);
}

const output = resolve('solve-with-me-manifest.json');
await writeFile(output, `${JSON.stringify({ version: 1, records }, null, 2)}\n`);
console.log(`Wrote ${records.length} verified records to ${basename(output)}.`);

