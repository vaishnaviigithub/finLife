import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import ChangeMakerLab from '@/src/components/finlabs/ChangeMakerLab';
import { getFinLabsChapter } from '@/src/finlabs/chapters';
import { isLabDone, FL_BG, FL_GREEN } from '@/src/finlabs/storage';
import { finLabsRoadmapHref } from '@/src/finlabs/routes';

export default function Lab2Screen() {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const chapterId = chapter ?? 'childhood';
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    isLabDone(chapterId, 1).then(setUnlocked);
  }, [chapterId]);

  if (!getFinLabsChapter(chapterId)) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  if (unlocked === null) {
    return (
      <View style={{ flex: 1, backgroundColor: FL_BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={FL_GREEN} />
      </View>
    );
  }

  if (!unlocked) {
    return <Redirect href={finLabsRoadmapHref(chapterId)} />;
  }

  return <ChangeMakerLab chapterId={chapterId} />;
}
