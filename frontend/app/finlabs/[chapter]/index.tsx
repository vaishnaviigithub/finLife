import { useLocalSearchParams } from 'expo-router';
import FinLabsRoadmap from '@/src/components/finlabs/FinLabsRoadmap';

export default function FinLabsChapterScreen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  return <FinLabsRoadmap chapterId={chapter ?? 'childhood'} />;
}
