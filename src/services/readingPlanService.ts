import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingPlan, ReadingDay, ActivePlan, PassageRef } from '../types/readingPlan';
import { recordReadingCompletion } from './profileService';
import type { ReadingCompletionResult } from './profileService';

const ACTIVE_PLAN_KEY = '@reading_plan_active_v1';

// ── NT book registry ──────────────────────────────────────────────────────────

const NT_BOOKS = [
  { name: 'Matthew',         bookIndex: 39, chapters: 28 },
  { name: 'Mark',            bookIndex: 40, chapters: 16 },
  { name: 'Luke',            bookIndex: 41, chapters: 24 },
  { name: 'John',            bookIndex: 42, chapters: 21 },
  { name: 'Acts',            bookIndex: 43, chapters: 28 },
  { name: 'Romans',          bookIndex: 44, chapters: 16 },
  { name: '1 Corinthians',   bookIndex: 45, chapters: 16 },
  { name: '2 Corinthians',   bookIndex: 46, chapters: 13 },
  { name: 'Galatians',       bookIndex: 47, chapters: 6  },
  { name: 'Ephesians',       bookIndex: 48, chapters: 6  },
  { name: 'Philippians',     bookIndex: 49, chapters: 4  },
  { name: 'Colossians',      bookIndex: 50, chapters: 4  },
  { name: '1 Thessalonians', bookIndex: 51, chapters: 5  },
  { name: '2 Thessalonians', bookIndex: 52, chapters: 3  },
  { name: '1 Timothy',       bookIndex: 53, chapters: 6  },
  { name: '2 Timothy',       bookIndex: 54, chapters: 4  },
  { name: 'Titus',           bookIndex: 55, chapters: 3  },
  { name: 'Philemon',        bookIndex: 56, chapters: 1  },
  { name: 'Hebrews',         bookIndex: 57, chapters: 13 },
  { name: 'James',           bookIndex: 58, chapters: 5  },
  { name: '1 Peter',         bookIndex: 59, chapters: 5  },
  { name: '2 Peter',         bookIndex: 60, chapters: 3  },
  { name: '1 John',          bookIndex: 61, chapters: 5  },
  { name: '2 John',          bookIndex: 62, chapters: 1  },
  { name: '3 John',          bookIndex: 63, chapters: 1  },
  { name: 'Jude',            bookIndex: 64, chapters: 1  },
  { name: 'Revelation',      bookIndex: 65, chapters: 22 },
] as const;

const NT_THEMES: Record<string, { titles: string[]; reflection: string }> = {
  'Matthew':         { titles: ['The King Arrives','Kingdom Teachings','Signs and Wonders','Parables of the Kingdom','The Road to Jerusalem','The Passion of the King','Crucified, Risen, Reigning'], reflection: 'Jesus arrives as the promised King — fulfilling every prophecy, redefining every expectation.' },
  'Mark':            { titles: ['The Urgent Servant','Power Over All Things','The Servant\'s Cross'], reflection: 'Mark moves with urgency — Jesus acts, heals, casts out, and saves without delay.' },
  'Luke':            { titles: ['Good News to the Humble','The Great Physician Walks','Parables of Radical Grace','The Road to the Cross','He Is Risen'], reflection: 'Luke shows a Savior who crosses every boundary to seek and save the lost.' },
  'John':            { titles: ['The Word Made Flesh','Signs That Lead to Belief','I AM the Way','Words for the Upper Room','Crucified and Glorified'], reflection: 'John invites us into the deepest intimacy with Jesus — every encounter is an invitation to believe.' },
  'Acts':            { titles: ['The Spirit Is Poured Out','The Church Expands','Persecution Scatters the Seed','To the Gentiles','Paul\'s Journey to Rome'], reflection: 'The Spirit empowers ordinary, frightened people to carry the Gospel to every corner of the earth.' },
  'Romans':          { titles: ['All Have Sinned','Justified by Faith Alone','Life in the Spirit','Israel and the Gospel','Living as Living Sacrifices'], reflection: 'Romans is the fullest statement of the Gospel ever written — grace, faith, Spirit, and transformed life.' },
  '1 Corinthians':   { titles: ['The Cross Upends Wisdom','Holiness in Community','Love Is the Greatest','The Hope of Resurrection'], reflection: 'The cross reshapes everything: how we think, love, worship, and hope.' },
  '2 Corinthians':   { titles: ['Ministry of Reconciliation','Strength Made Perfect in Weakness'], reflection: 'God\'s power is displayed most clearly through weakness, suffering, and dependence on grace.' },
  'Galatians':       { titles: ['Freedom Is the Gift of Grace'], reflection: 'Grace alone, faith alone — Paul defends the purity of the Gospel with urgent love.' },
  'Ephesians':       { titles: ['Seated in Heavenly Places','Walk Worthy of the Calling'], reflection: 'Before telling us how to live, Paul tells us who we already are in Christ.' },
  'Philippians':     { titles: ['Joy in Every Circumstance'], reflection: 'Written from prison, Philippians is the most joyful letter in the Bible.' },
  'Colossians':      { titles: ['Christ Is Supreme Over All'], reflection: 'Jesus is not one among many — He holds all things together and stands above every power.' },
  '1 Thessalonians': { titles: ['Waiting in Hope for the Lord'], reflection: 'The earliest letter of Paul calls a young church to live holy lives while waiting for Christ\'s return.' },
  '2 Thessalonians': { titles: ['Stand Firm Until the End'], reflection: 'Hold fast to sound teaching — don\'t be shaken by confusion or false reports about the last days.' },
  '1 Timothy':       { titles: ['Sound Doctrine, Holy Leadership'], reflection: 'Sound doctrine produces beautiful, holy communities. Guard both the teaching and your own life.' },
  '2 Timothy':       { titles: ['Fight the Good Fight to the End'], reflection: 'Paul\'s final letter — written near death — pours out his heart into one beloved son in the faith.' },
  'Titus':           { titles: ['Good Works for God\'s Glory'], reflection: 'Right belief always produces right living. The grace of God trains us toward godliness.' },
  'Philemon':        { titles: ['Reconciliation in Christ'], reflection: 'A letter about a runaway slave becomes a window into what radical forgiveness looks like in practice.' },
  'Hebrews':         { titles: ['Greater Than All','The Better Covenant','Faith That Endures'], reflection: 'Jesus is greater — greater than angels, Moses, the law, the priesthood, and every shadow that came before.' },
  'James':           { titles: ['Faith That Works'], reflection: 'Real faith always produces action. James calls the church to practical, costly obedience.' },
  '1 Peter':         { titles: ['Hope Beyond Suffering'], reflection: 'Suffering is not the end of the story. Peter calls a scattered, persecuted church to a living hope.' },
  '2 Peter':         { titles: ['Guard the Truth, Grow in Grace'], reflection: 'Grow in the knowledge of Christ and stay alert against teaching that twists the Gospel.' },
  '1 John':          { titles: ['Walking in Light and Love'], reflection: 'Those who truly know God will love God, walk in light, and love the people around them.' },
  '2 John':          { titles: ['Abide in Truth'], reflection: 'A tiny letter with a timeless message: walk in truth and guard the community of love.' },
  '3 John':          { titles: ['Faithful Hospitality'], reflection: 'Hospitality and faithfulness to the mission are acts of worship, not merely acts of kindness.' },
  'Jude':            { titles: ['Contend for the Faith'], reflection: 'The faith once delivered to the saints is worth every effort to preserve, protect, and proclaim.' },
  'Revelation':      { titles: ['The Lamb Who Was Slain','Seven Letters, One Vision','Tribulation and Triumph','All Things Made New'], reflection: 'The last book of the Bible is not a calendar of disasters — it is a vision of the Lamb\'s ultimate victory.' },
};

function generateNTIn90Days(): ReadingDay[] {
  const allChapters: PassageRef[] = [];
  for (const book of NT_BOOKS) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      allChapters.push({ book: book.name, bookIndex: book.bookIndex, chapter: ch });
    }
  }

  const readings: ReadingDay[] = [];
  let idx = 0;
  const bookTitleCounters: Record<string, number> = {};

  for (let day = 1; day <= 90 && idx < allChapters.length; day++) {
    const remaining = allChapters.length - idx;
    const daysLeft = 90 - day + 1;
    const count = Math.min(Math.max(Math.round(remaining / daysLeft), 2), 4);
    const dayPassages = allChapters.slice(idx, idx + count);
    idx += count;

    const primaryBook = dayPassages[0].book;
    const theme = NT_THEMES[primaryBook] ?? { titles: [`Day in ${primaryBook}`], reflection: `Today we continue in the letter of ${primaryBook}.` };
    const tIdx = bookTitleCounters[primaryBook] ?? 0;
    bookTitleCounters[primaryBook] = tIdx + 1;
    const title = theme.titles[Math.min(tIdx, theme.titles.length - 1)];

    readings.push({
      day,
      title,
      reflection: theme.reflection,
      estimatedMinutes: count * 3,
      passages: dayPassages,
    });
  }

  return readings;
}

// ── Psalms & Proverbs plan ────────────────────────────────────────────────────

const PSALMS_TITLES = [
  'The Way of the Righteous','The Lord Is My Shepherd','A Refuge in Every Storm',
  'Songs of Ascent','The God Who Hears','Praise as a Way of Life',
  'When God Seems Silent','The Faithful Mercies of God','Songs of Trust',
  'The Creator and His Creation','Wisdom for Daily Life','He Restores My Soul',
  'Songs of the Heart','The Goodness of the Lord','A New Song',
  'The Steadfast Love of God','Out of the Depths','The Lord Reigns',
  'Songs for the Journey','Walking in His Ways','He Who Made Heaven and Earth',
  'I Lift My Eyes','Dwell in the House of the Lord','Great Is the Lord',
  'Sing to the Lord a New Song','He Remembers His Covenant','The Majesty of God',
  'From Everlasting to Everlasting','The Lord Is Good','Praise the Lord',
];

function generatePsalmsProverbs(): ReadingDay[] {
  const readings: ReadingDay[] = [];
  for (let day = 1; day <= 30; day++) {
    const ps1 = (day - 1) * 5 + 1;
    const passages: PassageRef[] = [];
    for (let p = ps1; p <= Math.min(ps1 + 4, 150); p++) {
      passages.push({ book: 'Psalms', bookIndex: 18, chapter: p });
    }
    if (day <= 31) {
      passages.push({ book: 'Proverbs', bookIndex: 19, chapter: day });
    }
    readings.push({
      day,
      title: PSALMS_TITLES[day - 1] ?? `Songs of the Heart`,
      reflection: day === 1
        ? 'The Psalms are the prayer book of the Bible — every human emotion laid bare before a God who can handle all of it.'
        : day <= 10
        ? 'These ancient songs were sung in temples, written in caves, and whispered in darkness. They are still true today.'
        : day <= 20
        ? 'The wisdom of Proverbs asks us to slow down — to notice how we speak, how we live, and whom we trust.'
        : 'As we near the end of our journey, the Psalms culminate in pure, unbridled praise.',
      estimatedMinutes: passages.length * 2,
      passages,
    });
  }
  return readings;
}

// ── Foundations of Faith ──────────────────────────────────────────────────────

const FOUNDATIONS: ReadingDay[] = [
  { day: 1,  title: 'The Word Became Flesh',         reflection: 'John opens not with a birth story but a cosmic declaration: the eternal Word of God stepped into human skin.',         estimatedMinutes: 5,  passages: [{ book: 'John',          bookIndex: 42, chapter: 1  }] },
  { day: 2,  title: 'God So Loved the World',         reflection: 'The most famous verse in Scripture sits inside a conversation about being born again — new life from above.',           estimatedMinutes: 5,  passages: [{ book: 'John',          bookIndex: 42, chapter: 3  }] },
  { day: 3,  title: 'All Have Sinned',                reflection: 'Before grace can land, Paul shows us the depth of our need — every human being, without exception.',                   estimatedMinutes: 8,  passages: [{ book: 'Romans',        bookIndex: 44, chapter: 3  }, { book: 'Romans', bookIndex: 44, chapter: 4 }] },
  { day: 4,  title: 'Peace With God',                 reflection: 'Justified by faith, we have peace with God — not a feeling of peace, but a legal and relational reality.',              estimatedMinutes: 8,  passages: [{ book: 'Romans',        bookIndex: 44, chapter: 5  }, { book: 'Romans', bookIndex: 44, chapter: 6 }] },
  { day: 5,  title: 'No Condemnation',                reflection: 'Romans 8 is the summit of the Bible — no condemnation, the indwelling Spirit, and nothing that can separate us from love.', estimatedMinutes: 8,  passages: [{ book: 'Romans',        bookIndex: 44, chapter: 7  }, { book: 'Romans', bookIndex: 44, chapter: 8 }] },
  { day: 6,  title: 'Chosen and Saved by Grace',      reflection: 'Before we chose God, God chose us. Ephesians 1 and 2 reveal that salvation is entirely a gift.',                       estimatedMinutes: 8,  passages: [{ book: 'Ephesians',     bookIndex: 48, chapter: 1  }, { book: 'Ephesians', bookIndex: 48, chapter: 2 }] },
  { day: 7,  title: 'The Mystery of Christ',           reflection: 'God\'s eternal plan — the inclusion of every nation in one body — is now made known through the church.',              estimatedMinutes: 8,  passages: [{ book: 'Ephesians',     bookIndex: 48, chapter: 3  }, { book: 'Ephesians', bookIndex: 48, chapter: 4 }] },
  { day: 8,  title: 'The Humility of the Son',         reflection: 'Jesus, who was God, took on the posture of a servant — and calls us to do the same.',                                estimatedMinutes: 8,  passages: [{ book: 'Philippians',   bookIndex: 49, chapter: 1  }, { book: 'Philippians', bookIndex: 49, chapter: 2 }] },
  { day: 9,  title: 'Pressing Toward the Goal',        reflection: 'Paul has lost everything the world counts as gain — and counts it all as garbage compared to knowing Christ.',        estimatedMinutes: 7,  passages: [{ book: 'Philippians',   bookIndex: 49, chapter: 3  }, { book: 'Philippians', bookIndex: 49, chapter: 4 }] },
  { day: 10, title: 'Greater Than Angels',             reflection: 'Hebrews begins with a declaration: the Son is greater than every messenger God ever sent — even the angels.',          estimatedMinutes: 7,  passages: [{ book: 'Hebrews',       bookIndex: 57, chapter: 1  }, { book: 'Hebrews', bookIndex: 57, chapter: 2 }] },
  { day: 11, title: 'Faith Hall of Fame',              reflection: 'Hebrews 11 walks through centuries of men and women who trusted God\'s promises before they arrived.',                estimatedMinutes: 5,  passages: [{ book: 'Hebrews',       bookIndex: 57, chapter: 11 }] },
  { day: 12, title: 'Walking in the Light',            reflection: 'God is light, and in Him there is no darkness. 1 John calls us to a life of honesty, love, and abiding.',            estimatedMinutes: 7,  passages: [{ book: '1 John',        bookIndex: 61, chapter: 1  }, { book: '1 John', bookIndex: 61, chapter: 2 }] },
  { day: 13, title: 'Love One Another',                reflection: 'This is how we know we have passed from death to life — because we love one another.',                               estimatedMinutes: 7,  passages: [{ book: '1 John',        bookIndex: 61, chapter: 3  }, { book: '1 John', bookIndex: 61, chapter: 4 }] },
  { day: 14, title: 'All Things New',                  reflection: 'The Bible ends not with destruction but with restoration — a new heaven, a new earth, and no more tears.',            estimatedMinutes: 8,  passages: [{ book: 'Revelation',    bookIndex: 65, chapter: 21 }, { book: 'Revelation', bookIndex: 65, chapter: 22 }] },
];

// ── Anxiety & Peace ───────────────────────────────────────────────────────────

const ANXIETY_PEACE: ReadingDay[] = [
  { day: 1,  title: 'The Lord Is My Shepherd',        reflection: 'The most beloved poem ever written — a shepherd\'s song about provision, guidance, and presence in the valley.',     estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 23 }] },
  { day: 2,  title: 'God Is Our Refuge',              reflection: 'Though the earth gives way and the mountains fall into the sea, God is our refuge and our strength.',                 estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 46 }] },
  { day: 3,  title: 'Do Not Worry',                   reflection: 'Jesus doesn\'t scold us for worrying — He invites us to look at the birds and the flowers and trust our Father.',    estimatedMinutes: 4,  passages: [{ book: 'Matthew', bookIndex: 39, chapter: 6 }] },
  { day: 4,  title: 'Peace That Surpasses Understanding', reflection: 'The peace Paul describes isn\'t a feeling you manufacture — it is a guard that God himself posts over your heart.', estimatedMinutes: 5, passages: [{ book: 'Philippians', bookIndex: 49, chapter: 4 }] },
  { day: 5,  title: 'Those Who Hope in the Lord',     reflection: 'Isaiah 40 begins with comfort and ends with soaring on wings like eagles — a promise for the exhausted.',            estimatedMinutes: 5,  passages: [{ book: 'Isaiah', bookIndex: 22, chapter: 40 }] },
  { day: 6,  title: 'Do Not Fear — I Am With You',   reflection: 'Forty times in Isaiah, God says "do not fear." He doesn\'t say our fears are irrational — He says He is with us.',  estimatedMinutes: 5,  passages: [{ book: 'Isaiah', bookIndex: 22, chapter: 41 }] },
  { day: 7,  title: 'Peace I Leave With You',         reflection: 'Hours before the cross, Jesus gives his disciples a gift: peace — not as the world gives, but as He gives.',         estimatedMinutes: 5,  passages: [{ book: 'John', bookIndex: 42, chapter: 14 }] },
  { day: 8,  title: 'I Have Overcome the World',     reflection: 'Jesus tells us plainly: in this world you will have trouble. And then: take heart, I have overcome it.',               estimatedMinutes: 5,  passages: [{ book: 'John', bookIndex: 42, chapter: 16 }] },
  { day: 9,  title: 'Nothing Can Separate Us',        reflection: 'Paul lists every possible enemy — death, life, angels, demons, present, future — and declares: nothing can separate us.', estimatedMinutes: 5, passages: [{ book: 'Romans', bookIndex: 44, chapter: 8 }] },
  { day: 10, title: 'The God of All Comfort',         reflection: 'God comforts us in our affliction so that we can comfort others with the same comfort we received.',                  estimatedMinutes: 5,  passages: [{ book: '2 Corinthians', bookIndex: 46, chapter: 1 }] },
  { day: 11, title: 'Jars of Clay',                   reflection: 'We are fragile. We are cracked. And that is exactly the point — so the light inside is clearly from God, not from us.', estimatedMinutes: 5, passages: [{ book: '2 Corinthians', bookIndex: 46, chapter: 4 }] },
  { day: 12, title: 'My Grace Is Sufficient',         reflection: 'Paul begged three times for his thorn to be removed. God\'s answer was not relief but sufficiency.',                 estimatedMinutes: 5,  passages: [{ book: '2 Corinthians', bookIndex: 46, chapter: 12 }] },
  { day: 13, title: 'Cast All Your Anxiety',          reflection: 'A simple, radical instruction: give God every anxiety — because He cares about you.',                                estimatedMinutes: 4,  passages: [{ book: '1 Peter', bookIndex: 59, chapter: 5 }] },
  { day: 14, title: 'He Who Dwells in the Shelter',  reflection: 'Psalm 91 is a song for the endangered — a declaration that the Most High is a fortress for those who trust.',         estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 91 }] },
  { day: 15, title: 'I Lift My Eyes to the Hills',   reflection: 'My help comes from the Lord — the Maker of heaven and earth, the One who neither slumbers nor sleeps.',               estimatedMinutes: 3,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 121 }] },
  { day: 16, title: 'You Have Searched Me',           reflection: 'God knows every anxious thought before it forms — and still He stays, still He loves.',                              estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 139 }] },
  { day: 17, title: 'Great Is Your Faithfulness',    reflection: 'Written in the smoking ruins of Jerusalem — yet "the steadfast love of the Lord never ceases."',                      estimatedMinutes: 5,  passages: [{ book: 'Lamentations', bookIndex: 24, chapter: 3 }] },
  { day: 18, title: 'He Will Rejoice Over You',       reflection: 'Zephaniah gives us a breathtaking image: the God of the universe singing over you with joy.',                         estimatedMinutes: 3,  passages: [{ book: 'Zephaniah', bookIndex: 35, chapter: 3 }] },
  { day: 19, title: 'Come to Me, All Who Are Weary', reflection: 'Jesus doesn\'t say "try harder." He says "come to me" — and offers rest for the exhausted soul.',                     estimatedMinutes: 4,  passages: [{ book: 'Matthew', bookIndex: 39, chapter: 11 }] },
  { day: 20, title: 'A Rest Remains for the People', reflection: 'Hebrews 4 invites us into a Sabbath-rest — not as an achievement, but as a grace received by faith.',                estimatedMinutes: 4,  passages: [{ book: 'Hebrews', bookIndex: 57, chapter: 4 }] },
  { day: 21, title: 'No More Tears',                  reflection: 'The Bible\'s final promise to the anxious soul: God himself will wipe every tear from every eye.',                   estimatedMinutes: 5,  passages: [{ book: 'Revelation', bookIndex: 65, chapter: 21 }] },
];

// ── Prayer Life ───────────────────────────────────────────────────────────────

const PRAYER_LIFE: ReadingDay[] = [
  { day: 1,  title: 'The Lord\'s Prayer',             reflection: 'Jesus teaches us that prayer is not performance — it is conversation with a Father who already knows what we need.',  estimatedMinutes: 5,  passages: [{ book: 'Matthew', bookIndex: 39, chapter: 6 }] },
  { day: 2,  title: 'Ask, Seek, Knock',               reflection: 'God is not a reluctant giver. Jesus promises: everyone who asks receives, everyone who seeks finds.',                 estimatedMinutes: 5,  passages: [{ book: 'Luke', bookIndex: 41, chapter: 11 }] },
  { day: 3,  title: 'A Morning Prayer',               reflection: 'In the morning, O Lord, you hear my voice — prayer that begins the day surrenders it before it starts.',             estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 5 }] },
  { day: 4,  title: 'A Prayer of Repentance',         reflection: 'The most honest prayer David ever prayed — a broken man who discovered that a contrite heart is never despised.',    estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 51 }] },
  { day: 5,  title: 'Thirsting for God',              reflection: 'As the deer pants for water, my soul pants for you — the deepest longing the human soul can have.',                  estimatedMinutes: 4,  passages: [{ book: 'Psalms', bookIndex: 18, chapter: 63 }] },
  { day: 6,  title: 'Daniel Prays Without Ceasing',  reflection: 'Three times a day, windows open toward Jerusalem — Daniel\'s prayer life was not a discipline, it was his oxygen.',  estimatedMinutes: 5,  passages: [{ book: 'Daniel', bookIndex: 26, chapter: 6 }] },
  { day: 7,  title: 'Nehemiah\'s Confessing Prayer', reflection: 'Nehemiah hears of Jerusalem\'s ruins and immediately stops to pray — fasting, confessing, and interceding for his people.', estimatedMinutes: 4, passages: [{ book: 'Nehemiah', bookIndex: 15, chapter: 1 }] },
  { day: 8,  title: 'The High Priestly Prayer',       reflection: 'In John 17, Jesus prays for his disciples — and then prays for all who will believe through their message. He prays for you.', estimatedMinutes: 5, passages: [{ book: 'John', bookIndex: 42, chapter: 17 }] },
  { day: 9,  title: 'The Spirit Intercedes For Us',  reflection: 'When we don\'t know how to pray, the Spirit himself prays for us with groans too deep for words.',                   estimatedMinutes: 5,  passages: [{ book: 'Romans', bookIndex: 44, chapter: 8 }] },
  { day: 10, title: 'Pray at All Times',              reflection: 'Paul doesn\'t say pray often — he says pray at all times. Prayer is not one activity among many; it is a posture.',  estimatedMinutes: 4,  passages: [{ book: 'Ephesians', bookIndex: 48, chapter: 6 }] },
  { day: 11, title: 'In Everything Give Thanks',      reflection: 'Rejoice always. Pray without ceasing. Give thanks in all circumstances. Three simple lines that reshape a life.',   estimatedMinutes: 3,  passages: [{ book: '1 Thessalonians', bookIndex: 51, chapter: 5 }] },
  { day: 12, title: 'By Prayer and Supplication',    reflection: 'Do not be anxious about anything — instead, pray about everything. This is the antidote Paul prescribes.',           estimatedMinutes: 3,  passages: [{ book: 'Philippians', bookIndex: 49, chapter: 4 }] },
  { day: 13, title: 'The Prayer of a Righteous Person', reflection: 'Elijah prayed that it would not rain — and it didn\'t, for three years. The effective prayer of a righteous person is powerful.', estimatedMinutes: 4, passages: [{ book: 'James', bookIndex: 58, chapter: 5 }] },
  { day: 14, title: 'Prayers as Incense',             reflection: 'In Revelation, the prayers of the saints are gathered as golden bowls of incense before the throne of God.',          estimatedMinutes: 5,  passages: [{ book: 'Revelation', bookIndex: 65, chapter: 8 }] },
];

// ── Plan catalog ──────────────────────────────────────────────────────────────

const NT_READINGS = generateNTIn90Days();
const PSALMS_READINGS = generatePsalmsProverbs();

export const READING_PLANS: ReadingPlan[] = [
  {
    id: 'nt-90-days',
    title: 'New Testament in 90 Days',
    subtitle: '3 chapters daily',
    description: 'Walk through the entire New Testament in 90 days — from Matthew to Revelation — in a pace that is immersive without being overwhelming.',
    totalDays: 90,
    dailyMinutes: 9,
    category: 'biblical',
    gradient: ['#12103A', '#070618'],
    icon: '✦',
    readings: NT_READINGS,
  },
  {
    id: 'psalms-proverbs',
    title: 'Psalms & Proverbs',
    subtitle: '30 days · Wisdom & Worship',
    description: 'Thirty days through the poetry and wisdom of Scripture — songs of lament, songs of praise, and practical guidance for daily life.',
    totalDays: 30,
    dailyMinutes: 6,
    category: 'biblical',
    gradient: ['#1A0D2E', '#0A0818'],
    icon: '🌿',
    readings: PSALMS_READINGS,
  },
  {
    id: 'foundations-of-faith',
    title: 'Foundations of Faith',
    subtitle: '14 days · Core Gospel passages',
    description: 'A two-week journey through the essential pillars of the Christian faith — grace, justification, love, hope, and the promise of resurrection.',
    totalDays: 14,
    dailyMinutes: 7,
    category: 'biblical',
    gradient: ['#1A1005', '#0C0804'],
    icon: '⚓',
    readings: FOUNDATIONS,
  },
  {
    id: 'anxiety-and-peace',
    title: 'Anxiety & Peace',
    subtitle: '21 days · Finding God in the storm',
    description: 'Twenty-one days of Scripture hand-selected for those who wrestle with worry, fear, and uncertainty — and who need to be reminded that God is near.',
    totalDays: 21,
    dailyMinutes: 5,
    category: 'topical',
    gradient: ['#081A14', '#030D09'],
    icon: '🕊',
    readings: ANXIETY_PEACE,
  },
  {
    id: 'prayer-life',
    title: 'Prayer Life',
    subtitle: '14 days · Learning to pray deeply',
    description: 'A two-week exploration of what the Bible teaches about prayer — honest prayers, desperate prayers, joyful prayers, and prayers that move heaven.',
    totalDays: 14,
    dailyMinutes: 5,
    category: 'topical',
    gradient: ['#1A0A0A', '#0A0404'],
    icon: '🙏',
    readings: PRAYER_LIFE,
  },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── AsyncStorage helpers ──────────────────────────────────────────────────────

export async function getActivePlan(): Promise<ActivePlan | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActivePlan;
  } catch {
    return null;
  }
}

export async function setActivePlan(planId: string): Promise<ActivePlan> {
  const plan: ActivePlan = {
    planId,
    startDate: new Date().toISOString(),
    currentDay: 1,
    completedDays: [],
    streak: 0,
    lastCompletedDate: null,
  };
  await AsyncStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
  return plan;
}

export type CompletionResult = ReadingCompletionResult & {
  plan: ActivePlan;
};

export async function completeDay(day: number): Promise<CompletionResult> {
  const current = await getActivePlan();
  if (!current) throw new Error('No active plan');

  // Global streak is the single source of truth — idempotent per day
  const streakResult = await recordReadingCompletion();

  if (streakResult.alreadyDoneToday && current.lastCompletedDate === todayKey()) {
    return { plan: current, ...streakResult };
  }

  const today = todayKey();
  const completedDays = current.completedDays.includes(day)
    ? current.completedDays
    : [...current.completedDays, day];

  const plan = getPlanById(current.planId);
  const nextDay = Math.min(day + 1, plan?.totalDays ?? day + 1);

  const updated: ActivePlan = {
    ...current,
    currentDay: nextDay,
    completedDays,
    streak: streakResult.streak, // synced with global streak
    lastCompletedDate: today,
  };
  await AsyncStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(updated));
  return { plan: updated, ...streakResult };
}

export async function clearActivePlan(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_PLAN_KEY);
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export function getPlanById(id: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === id);
}

export function getTodayReading(activePlan: ActivePlan): ReadingDay | null {
  const plan = getPlanById(activePlan.planId);
  if (!plan) return null;
  const day = plan.readings.find((r) => r.day === activePlan.currentDay);
  return day ?? null;
}

export function isTodayCompleted(activePlan: ActivePlan): boolean {
  return activePlan.lastCompletedDate === todayKey();
}

export function planProgress(activePlan: ActivePlan): number {
  const plan = getPlanById(activePlan.planId);
  if (!plan || plan.totalDays === 0) return 0;
  return (activePlan.currentDay - 1) / plan.totalDays;
}

export function passageLabel(passages: PassageRef[]): string {
  if (passages.length === 0) return '';
  if (passages.length === 1) {
    return `${passages[0].book} ${passages[0].chapter}`;
  }
  const books = [...new Set(passages.map((p) => p.book))];
  if (books.length === 1) {
    const chs = passages.map((p) => p.chapter).join(', ');
    return `${books[0]} ${chs}`;
  }
  return passages.map((p) => `${p.book} ${p.chapter}`).join(' · ');
}
