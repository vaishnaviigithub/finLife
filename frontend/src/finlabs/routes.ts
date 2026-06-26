import { Href } from 'expo-router';

export function finLabsRoadmapHref(chapterId: string): Href {
  return {
    pathname: '/finlabs/[chapter]',
    params: { chapter: chapterId },
  } as unknown as Href;
}

export function finLabsLabHref(chapterId: string, route: string): Href {
  return {
    pathname: `/finlabs/[chapter]/${route}`,
    params: { chapter: chapterId },
  } as unknown as Href;
}

/** Legacy childhood lab numbers */
export function finLabsLegacyLabHref(chapterId: string, labNum: 1 | 2): Href {
  return finLabsLabHref(chapterId, labNum === 1 ? 'lab1' : 'lab2');
}
