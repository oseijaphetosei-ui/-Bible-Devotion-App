export type DailyVerse = {
  usfm: string;
  bookIndex: number;
  chapter: number;
  verse: number;
  label: string;
  fallbackText: string;
  tags: string[];
  image: any;
};

export const DAILY_VERSES: DailyVerse[] = [
  {
    usfm: 'PSA', bookIndex: 18, chapter: 46, verse: 10,
    label: 'Psalm 46:10',
    fallbackText: '"Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."',
    tags: ['PSALM 46', 'STILLNESS', 'PEACE'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'JHN', bookIndex: 42, chapter: 3, verse: 16,
    label: 'John 3:16',
    fallbackText: '"For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."',
    tags: ['JOHN 3', 'LOVE', 'SALVATION'],
    image: require('../assets/dove.jpg'),
  },
  {
    usfm: 'PHP', bookIndex: 49, chapter: 4, verse: 13,
    label: 'Philippians 4:13',
    fallbackText: '"I can do all this through him who gives me strength."',
    tags: ['PHILIPPIANS 4', 'STRENGTH', 'FAITH'],
    image: require('../assets/open-bible-in-the-morning.jpg'),
  },
  {
    usfm: 'JER', bookIndex: 23, chapter: 29, verse: 11,
    label: 'Jeremiah 29:11',
    fallbackText: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, plans to give you hope and a future."',
    tags: ['JEREMIAH 29', 'HOPE', 'PURPOSE'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'ROM', bookIndex: 44, chapter: 8, verse: 28,
    label: 'Romans 8:28',
    fallbackText: '"And we know that in all things God works for the good of those who love him, who have been called according to his purpose."',
    tags: ['ROMANS 8', 'TRUST', 'PURPOSE'],
    image: require('../assets/open-bible-in-the-morning.jpg'),
  },
  {
    usfm: 'ISA', bookIndex: 22, chapter: 40, verse: 31,
    label: 'Isaiah 40:31',
    fallbackText: '"But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."',
    tags: ['ISAIAH 40', 'HOPE', 'STRENGTH'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'PRO', bookIndex: 19, chapter: 3, verse: 5,
    label: 'Proverbs 3:5',
    fallbackText: '"Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."',
    tags: ['PROVERBS 3', 'TRUST', 'WISDOM'],
    image: require('../assets/open-bible-in-the-morning.jpg'),
  },
  {
    usfm: 'MAT', bookIndex: 39, chapter: 11, verse: 28,
    label: 'Matthew 11:28',
    fallbackText: '"Come to me, all you who are weary and burdened, and I will give you rest."',
    tags: ['MATTHEW 11', 'REST', 'COMFORT'],
    image: require('../assets/stones.jpg'),
  },
  {
    usfm: 'PSA', bookIndex: 18, chapter: 23, verse: 1,
    label: 'Psalm 23:1',
    fallbackText: '"The Lord is my shepherd, I lack nothing."',
    tags: ['PSALM 23', 'PROVISION', 'PEACE'],
    image: require('../assets/dove.jpg'),
  },
  {
    usfm: 'JOS', bookIndex: 5, chapter: 1, verse: 9,
    label: 'Joshua 1:9',
    fallbackText: '"Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."',
    tags: ['JOSHUA 1', 'COURAGE', 'FAITH'],
    image: require('../assets/stones.jpg'),
  },
  {
    usfm: 'EPH', bookIndex: 48, chapter: 2, verse: 8,
    label: 'Ephesians 2:8',
    fallbackText: '"For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God."',
    tags: ['EPHESIANS 2', 'GRACE', 'SALVATION'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'HEB', bookIndex: 57, chapter: 11, verse: 1,
    label: 'Hebrews 11:1',
    fallbackText: '"Now faith is confidence in what we hope for and assurance about what we do not see."',
    tags: ['HEBREWS 11', 'FAITH', 'HOPE'],
    image: require('../assets/dove.jpg'),
  },
  {
    usfm: '1PE', bookIndex: 59, chapter: 5, verse: 7,
    label: '1 Peter 5:7',
    fallbackText: '"Cast all your anxiety on him because he cares for you."',
    tags: ['1 PETER 5', 'TRUST', 'PEACE'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'MIC', bookIndex: 32, chapter: 6, verse: 8,
    label: 'Micah 6:8',
    fallbackText: '"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."',
    tags: ['MICAH 6', 'JUSTICE', 'HUMILITY'],
    image: require('../assets/apostles.jpg'),
  },
  {
    usfm: 'JHN', bookIndex: 42, chapter: 14, verse: 6,
    label: 'John 14:6',
    fallbackText: '"Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me."',
    tags: ['JOHN 14', 'TRUTH', 'SALVATION'],
    image: require('../assets/dove.jpg'),
  },
  {
    usfm: 'PSA', bookIndex: 18, chapter: 119, verse: 105,
    label: 'Psalm 119:105',
    fallbackText: '"Your word is a lamp for my feet, a light on my path."',
    tags: ['PSALM 119', 'WISDOM', 'GUIDANCE'],
    image: require('../assets/open-bible-in-the-morning.jpg'),
  },
  {
    usfm: 'PSA', bookIndex: 18, chapter: 27, verse: 1,
    label: 'Psalm 27:1',
    fallbackText: '"The Lord is my light and my salvation — whom shall I fear? The Lord is the stronghold of my life — of whom shall I be afraid?"',
    tags: ['PSALM 27', 'COURAGE', 'SALVATION'],
    image: require('../assets/hands-cluds.jpg'),
  },
  {
    usfm: 'JHN', bookIndex: 42, chapter: 16, verse: 33,
    label: 'John 16:33',
    fallbackText: '"I have told you these things, so that in me you may have peace. In this world you will have trouble. But take heart! I have overcome the world."',
    tags: ['JOHN 16', 'PEACE', 'VICTORY'],
    image: require('../assets/dove.jpg'),
  },
  {
    usfm: 'ISA', bookIndex: 22, chapter: 41, verse: 10,
    label: 'Isaiah 41:10',
    fallbackText: '"So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand."',
    tags: ['ISAIAH 41', 'COURAGE', 'STRENGTH'],
    image: require('../assets/stones.jpg'),
  },
  {
    usfm: 'PHP', bookIndex: 49, chapter: 4, verse: 6,
    label: 'Philippians 4:6',
    fallbackText: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."',
    tags: ['PHILIPPIANS 4', 'PEACE', 'PRAYER'],
    image: require('../assets/hands-cluds.jpg'),
  },
];
