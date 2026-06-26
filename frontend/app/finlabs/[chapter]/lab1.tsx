import { Redirect, useLocalSearchParams } from 'expo-router';
import PocketMoneyLab from '@/src/components/finlabs/PocketMoneyLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function Lab1Screen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'childhood';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <PocketMoneyLab chapterId={chapterId} />;
}
