import { Redirect, useLocalSearchParams } from 'expo-router';
import SkillsLab from '@/src/components/finlabs/teenage/SkillsLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function SkillsLabScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'teenage';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <SkillsLab chapterId={chapterId} />;
}
