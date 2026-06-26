import AsyncStorage from '@react-native-async-storage/async-storage';

export const FL_GREEN = '#00FF9C';
export const FL_BG = '#0D0D0D';
export const FL_YELLOW = '#FFD700';

export function chapterStatusKey(chapterId: string) {
  return `chapter_${chapterId}_status`;
}

/** Childhood labs (legacy numeric keys) */
export function labDoneKey(chapterId: string, labNum: 1 | 2) {
  return `finlab_${chapterId}_${labNum}_done`;
}

export async function getChapterStatus(chapterId: string): Promise<string | null> {
  return AsyncStorage.getItem(chapterStatusKey(chapterId));
}

export async function setChapterStatusDone(chapterId: string): Promise<void> {
  await AsyncStorage.setItem(chapterStatusKey(chapterId), 'DONE');
}

export async function isLabDone(chapterId: string, labNum: 1 | 2): Promise<boolean> {
  const v = await AsyncStorage.getItem(labDoneKey(chapterId, labNum));
  return v === 'true';
}

export async function setLabDone(chapterId: string, labNum: 1 | 2): Promise<void> {
  await AsyncStorage.setItem(labDoneKey(chapterId, labNum), 'true');
}

/** Generic flag keys e.g. finlab_teenage_emi_done */
export async function isLabFlagDone(flagKey: string): Promise<boolean> {
  const v = await AsyncStorage.getItem(flagKey);
  return v === 'true';
}

export async function setLabFlagDone(flagKey: string): Promise<void> {
  await AsyncStorage.setItem(flagKey, 'true');
}

export function tutorialSeenKey(flagKey: string) {
  return `${flagKey}_tutorial_seen`;
}

export async function isTutorialSeen(flagKey: string): Promise<boolean> {
  return (await AsyncStorage.getItem(tutorialSeenKey(flagKey))) === 'true';
}

export async function setTutorialSeen(flagKey: string): Promise<void> {
  await AsyncStorage.setItem(tutorialSeenKey(flagKey), 'true');
}
