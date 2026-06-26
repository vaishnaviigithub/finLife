import { Redirect, useLocalSearchParams } from 'expo-router';
import EmiTrapLab from '@/src/components/finlabs/teenage/EmiTrapLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function EmiLabScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'teenage';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <EmiTrapLab chapterId={chapterId} />;
}
