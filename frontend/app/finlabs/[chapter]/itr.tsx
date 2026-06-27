import { Redirect, useLocalSearchParams } from 'expo-router';
import ItrLab from '@/src/components/finlabs/firstjob/ItrLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function ItrLabScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'early_career';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <ItrLab chapterId={chapterId} />;
}
