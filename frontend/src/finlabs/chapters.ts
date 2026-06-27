export type LabNode = {
  id: string;
  route: string;
  title: string;
  emoji: string;
  icon?: string;
  subtitle: string;
  doneKey: string;
  requiresDoneKey?: string;
};

export type FinLabsChapter = {
  chapterId: string;
  title: string;
  subtitle: string;
  landscape: string;
  labs: LabNode[];
};

export const FINLABS_CHAPTERS: Record<string, FinLabsChapter> = {
  childhood: {
    chapterId: 'childhood',
    title: 'CHILDHOOD',
    subtitle: 'Practice Zone · No consequences, all learning',
    landscape: 'VILLAGE',
    labs: [
      {
        id: 'lab1',
        route: 'lab1',
        title: 'POCKET MONEY',
        emoji: '💰',
        subtitle: 'Plan your week',
        doneKey: 'finlab_childhood_1_done',
      },
      {
        id: 'lab2',
        route: 'lab2',
        title: 'CHANGE MAKER',
        emoji: '🪙',
        subtitle: 'Run the till',
        doneKey: 'finlab_childhood_2_done',
        requiresDoneKey: 'finlab_childhood_1_done',
      },
    ],
  },
  teenage: {
    chapterId: 'teenage',
    title: 'TEENAGE',
    subtitle: 'Practice Zone · No consequences, all learning',
    landscape: 'NEIGHBOURHOOD',
    labs: [
      {
        id: 'emi',
        route: 'emi',
        title: 'EMI TRAP',
        emoji: '📱',
        subtitle: 'Read before you sign',
        doneKey: 'finlab_teenage_emi_done',
      },
      {
        id: 'bank',
        route: 'bank',
        title: 'FIRST BANK',
        emoji: '🏦',
        subtitle: 'Open it. Understand it.',
        doneKey: 'finlab_teenage_bank_done',
        requiresDoneKey: 'finlab_teenage_emi_done',
      },
      {
        id: 'peer',
        route: 'peer',
        title: 'PEER PRESSURE',
        emoji: '👥',
        subtitle: '₹800. Social score is real.',
        doneKey: 'finlab_teenage_peer_done',
        requiresDoneKey: 'finlab_teenage_bank_done',
      },
      {
        id: 'skills',
        route: 'skills',
        title: 'SELL YOUR SKILLS',
        emoji: '💼',
        subtitle: 'Price it. Invoice it.',
        doneKey: 'finlab_teenage_skills_done',
        requiresDoneKey: 'finlab_teenage_peer_done',
      },
      {
        id: 'gst',
        route: 'gst',
        title: 'RESTAURANT GST',
        emoji: '🍽️',
        subtitle: 'Decode the bill.',
        doneKey: 'finlab_teenage_gst_done',
        requiresDoneKey: 'finlab_teenage_skills_done',
      },
    ],
  },
  early_career: {
    chapterId: 'early_career',
    title: 'EARLY CAREER',
    subtitle: 'Practice Zone Â· No consequences, all learning',
    landscape: 'CITY',
    labs: [
      {
        id: 'itr',
        route: 'itr',
        title: 'FILING YOUR ITR',
        icon: 'file-document-edit',
        emoji: 'ðŸ§¾',
        subtitle: 'Claim your refund.',
        doneKey: 'finlab_firstjob_itr_done',
      },
    ],
  },
};

export function getFinLabsChapter(chapterId: string): FinLabsChapter | null {
  return FINLABS_CHAPTERS[chapterId] ?? null;
}
