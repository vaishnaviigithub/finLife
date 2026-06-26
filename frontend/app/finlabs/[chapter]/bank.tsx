import { Redirect, useLocalSearchParams } from 'expo-router';
import BankAccountLab from '@/src/components/finlabs/teenage/BankAccountLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function BankLabScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'teenage';

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <BankAccountLab chapterId={chapterId} />;
}
