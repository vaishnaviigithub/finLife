import { Redirect, useLocalSearchParams } from 'expo-router';
import PeerPressureLab from '@/src/components/finlabs/teenage/PeerPressureLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function PeerLabScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'teenage';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <PeerPressureLab chapterId={chapterId} />;
}
