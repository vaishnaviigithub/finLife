import { ImageSourcePropType } from 'react-native';

export const ARTIFACTS = {
  baby: require('../../assets/artifacts/baby.png'),
  birthday: require('../../assets/artifacts/birthday.png'),
  book: require('../../assets/artifacts/book.png'),
  boy: require('../../assets/artifacts/boy.png'),
  budgeti: require('../../assets/artifacts/budgeti.png'),
  building: require('../../assets/artifacts/building.png'),
  cafe: require('../../assets/artifacts/cafe.png'),
  childhood: require('../../assets/artifacts/childhood.png'),
  city: require('../../assets/artifacts/city.png'),
  college: require('../../assets/artifacts/college.png'),
  fireworks: require('../../assets/artifacts/fireworks.png'),
  gift: require('../../assets/artifacts/gift.png'),
  job: require('../../assets/artifacts/job.png'),
  kidRunning: require('../../assets/artifacts/kid running.png'),
  kidsPlaying: require('../../assets/artifacts/kids playing.png'),
  laptopBooks: require('../../assets/artifacts/laptop books.png'),
  loan: require('../../assets/artifacts/loan.png'),
  marks: require('../../assets/artifacts/marks.png'),
  moneyStack: require('../../assets/artifacts/money stack.png'),
  money: require('../../assets/artifacts/money.png'),
  penMarkers: require('../../assets/artifacts/pen markers.png'),
  piggyBank: require('../../assets/artifacts/piggy bank.png'),
  scam: require('../../assets/artifacts/scam.png'),
  school: require('../../assets/artifacts/school.png'),
  seesaw: require('../../assets/artifacts/seesaw.png'),
  stationery: require('../../assets/artifacts/stationery.png'),
  student: require('../../assets/artifacts/student.png'),
  swing: require('../../assets/artifacts/swing.png'),
  toys: require('../../assets/artifacts/toys.png'),
  wallet: require('../../assets/artifacts/wallet.png'),
} as const satisfies Record<string, ImageSourcePropType>;

export type ArtifactKey = keyof typeof ARTIFACTS;

const SCENARIO_ARTIFACTS: Record<string, ArtifactKey> = {
  c1s1: 'birthday',
  c1s2: 'piggyBank',
  c1s3: 'marks',
  c1s4: 'toys',
  c1s5: 'fireworks',
  c1s6: 'wallet',
  c2s1: 'wallet',
  c2s2: 'book',
  c2s3: 'gift',
  c2s4: 'cafe',
  c2s5: 'job',
  c2s6: 'scam',
  c2s7: 'loan',
  c3s1: 'loan',
  c3s2: 'scam',
  c3s3: 'moneyStack',
  c3s4: 'student',
  c3s5: 'wallet',
  c3s6: 'laptopBooks',
  c3s7: 'moneyStack',
};

const CHAPTER_BG: Record<string, ArtifactKey> = {
  childhood: 'childhood',
  teenage: 'city',
  college: 'college',
};

const CHAPTER_ACCENT: Record<string, ArtifactKey> = {
  childhood: 'baby',
  teenage: 'student',
  college: 'laptopBooks',
};

const COMING_SOON_ARTIFACTS: ArtifactKey[] = ['job', 'building', 'budgeti', 'wallet'];

export function getScenarioArtifact(scenarioId: string): ArtifactKey {
  return SCENARIO_ARTIFACTS[scenarioId] ?? 'money';
}

export function getChapterBackground(chapterId: string): ArtifactKey {
  return CHAPTER_BG[chapterId] ?? 'city';
}

export function getChapterAccent(chapterId: string): ArtifactKey {
  return CHAPTER_ACCENT[chapterId] ?? 'money';
}

export function getComingSoonArtifact(index: number): ArtifactKey {
  return COMING_SOON_ARTIFACTS[index % COMING_SOON_ARTIFACTS.length];
}

type SceneType = 'home' | 'street' | 'school' | 'phone' | 'college' | 'hostel' | 'bank';

export type SceneProp = {
  source: ImageSourcePropType;
  left?: number | `${number}%`;
  right?: number | `${number}%`;
  bottom?: number;
  top?: number;
  width: number;
  height: number;
  opacity?: number;
};

export function getSceneProps(scene: SceneType): SceneProp[] {
  switch (scene) {
    case 'home':
      return [
        { source: ARTIFACTS.piggyBank, left: '6%', bottom: 62, width: 72, height: 72 },
        { source: ARTIFACTS.gift, right: '8%', bottom: 58, width: 68, height: 68 },
        { source: ARTIFACTS.seesaw, left: '36%', bottom: 66, width: 58, height: 58, opacity: 0.9 },
        { source: ARTIFACTS.fireworks, right: '28%', bottom: 78, width: 48, height: 48, opacity: 0.85 },
      ];
    case 'school':
      return [
        { source: ARTIFACTS.school, left: '4%', bottom: 58, width: 110, height: 110 },
        { source: ARTIFACTS.stationery, right: '6%', bottom: 62, width: 64, height: 64 },
        { source: ARTIFACTS.penMarkers, right: '22%', bottom: 72, width: 52, height: 52, opacity: 0.9 },
        { source: ARTIFACTS.marks, left: '28%', bottom: 70, width: 50, height: 50, opacity: 0.85 },
      ];
    case 'street':
      return [
        { source: ARTIFACTS.cafe, left: '5%', bottom: 56, width: 88, height: 88 },
        { source: ARTIFACTS.city, right: '2%', bottom: 52, width: 100, height: 100, opacity: 0.9 },
        { source: ARTIFACTS.kidRunning, left: '42%', bottom: 64, width: 56, height: 56 },
      ];
    case 'college':
      return [
        { source: ARTIFACTS.college, left: '6%', bottom: 54, width: 100, height: 100 },
        { source: ARTIFACTS.laptopBooks, right: '8%', bottom: 58, width: 72, height: 72 },
        { source: ARTIFACTS.student, right: '30%', bottom: 66, width: 58, height: 58 },
      ];
    case 'phone':
      return [
        { source: ARTIFACTS.wallet, left: '18%', bottom: 64, width: 64, height: 64 },
        { source: ARTIFACTS.scam, right: '16%', bottom: 60, width: 70, height: 70 },
        { source: ARTIFACTS.money, left: '44%', bottom: 68, width: 48, height: 48, opacity: 0.9 },
      ];
    case 'hostel':
      return [
        { source: ARTIFACTS.student, left: '10%', bottom: 58, width: 72, height: 72 },
        { source: ARTIFACTS.book, right: '12%', bottom: 62, width: 60, height: 60 },
        { source: ARTIFACTS.kidRunning, right: '34%', bottom: 64, width: 54, height: 54 },
      ];
    case 'bank':
      return [
        { source: ARTIFACTS.moneyStack, left: '8%', bottom: 58, width: 76, height: 76 },
        { source: ARTIFACTS.loan, right: '10%', bottom: 56, width: 72, height: 72 },
        { source: ARTIFACTS.building, left: '38%', bottom: 60, width: 64, height: 64, opacity: 0.85 },
      ];
    default:
      return [];
  }
}

export const LIFE_STAGE_ARTIFACTS: { label: string; age: string; key: ArtifactKey }[] = [
  { label: 'Childhood', age: '8-14', key: 'piggyBank' },
  { label: 'Teenage', age: '14-19', key: 'school' },
  { label: 'College', age: '19-24', key: 'college' },
  { label: 'First Job', age: '24-29', key: 'job' },
  { label: 'Mid-Life', age: '30-39', key: 'building' },
  { label: 'Crisis', age: '40-49', key: 'budgeti' },
  { label: 'Retirement', age: '60+', key: 'wallet' },
];
