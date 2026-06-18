import { Devotion, BibleTranslation } from '../types/devotion';

// Update this to your deployed server URL when ready
const SERVER_URL = 'http://localhost:3001';

// ─── Hardcoded fallbacks ──────────────────────────────────────────────────────

const FALLBACKS: Record<string, Devotion> = {
  peace: {
    title: "The Peace That Guards Your Heart",
    scriptureReference: "Philippians 4:6-7",
    scriptureText: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
    keyTheme: "Inner Peace",
    devotionalBody: [
      "Anxiety is one of the heaviest burdens we carry. We worry about tomorrow's problems, yesterday's mistakes, and today's uncertainties. Yet Paul, writing from a prison cell, urges us not to be anxious about anything — not because problems don't exist, but because God is greater than every problem.",
      "The antidote Paul prescribes is not positive thinking or distraction. It is prayer — specific, grateful, and expectant prayer. When we bring our requests to God with thanksgiving, we acknowledge that He has already been faithful, and we trust He will continue to be.",
      "What follows is extraordinary: a peace that transcends understanding. This is not the absence of hardship — Paul was in chains when he wrote this. It is the presence of God standing guard over your inner world, keeping your heart steady when everything outside is shaking.",
    ],
    lifeApplication: "Write down the three things causing you the most anxiety today. Then spend five minutes praying over each one specifically, ending with a sentence of thanksgiving for what God has already done in your life.",
    reflectionQuestion: "Is there an area of your life where you have been carrying anxiety instead of bringing it to God in prayer? What would it look like to fully surrender that to Him today?",
    guidedPrayer: "Father, I confess that I have been carrying burdens you never asked me to carry alone. Today I bring before You every worry, every fear, every uncertainty. I thank You for Your faithfulness in my past, and I trust You with my future. Let Your peace — the kind that doesn't make logical sense — guard my heart and mind today. In Jesus' name, Amen.",
    shareableQuote: "\"God's peace doesn't wait for your circumstances to change — it guards your heart right in the middle of them.\"",
  },
  grace: {
    title: "Grace Sufficient for Today",
    scriptureReference: "2 Corinthians 12:9",
    scriptureText: "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me.",
    keyTheme: "God's Grace",
    devotionalBody: [
      "There is something profoundly counterintuitive about grace. We are conditioned to believe that strength comes from our own effort, our own discipline, our own resilience. Yet God's economy works differently — His power is most fully displayed in our weakness.",
      "Paul had a thorn in his flesh, some persistent struggle he begged God to remove three times. God's answer was not removal but redefinition. The thorn remained, but so did the grace — and that grace was enough. More than enough.",
      "This is the scandal of grace: it doesn't fix everything, but it is sufficient for everything. When you feel most inadequate, most broken, most unable — that is precisely when God's strength has the most room to work. Your weakness is not a disqualifier. It is an invitation.",
    ],
    lifeApplication: "Identify one area where you have been striving in your own strength. Today, consciously release that area to God and ask Him to work through your weakness rather than despite it.",
    reflectionQuestion: "How has your perception of weakness affected your relationship with God? Have you been hiding your struggles from Him, or bringing them to Him as the very place where His grace can shine?",
    guidedPrayer: "Lord, I come to You in my weakness today. I stop pretending that I have it all together. Your word promises that Your grace is sufficient — and I choose to believe that over my feelings of inadequacy. Work through me, not because of my strength, but because of Your power made perfect in my weakness. Amen.",
    shareableQuote: "\"Your greatest weakness is God's greatest opportunity. His grace is not a supplement to your strength — it is your strength.\"",
  },
  faith: {
    title: "Faith: The Evidence of Things Unseen",
    scriptureReference: "Hebrews 11:1",
    scriptureText: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    keyTheme: "Living Faith",
    devotionalBody: [
      "Faith is often misunderstood as wishful thinking — a leap into the dark with fingers crossed. But the writer of Hebrews gives us a precise definition: faith is confidence and assurance. These are not passive feelings; they are active stances of trust in the character and promises of God.",
      "What makes faith remarkable is not the size of it, but the object of it. A small seed of genuine faith in an all-powerful God accomplishes far more than a mountain of confidence in anything lesser. Faith is only as strong as the One in whom it is placed.",
      "The heroes of Hebrews 11 — Abraham, Moses, Rahab — all acted on what they could not yet see. They made decisions based on promises rather than proofs. And in doing so, they participated in something eternal. Faith doesn't just change circumstances; it changes us — making us into people who walk by conviction, not by sight.",
    ],
    lifeApplication: "Take one step today that requires you to trust God's promise over your present reality. It doesn't need to be dramatic — it could be a conversation you've been avoiding, a decision you've been delaying, or a prayer you've been afraid to pray.",
    reflectionQuestion: "Where in your life are you waiting to see before you believe? What promise of God could you stand on today, even without visible evidence?",
    guidedPrayer: "God of Abraham, Isaac, and Jacob — You are the same yesterday, today, and forever. Strengthen my faith to trust Your promises even when I cannot see the outcome. Help me to be someone who walks by faith, not by sight. Where I am afraid, replace my fear with confidence in who You are. Amen.",
    shareableQuote: "\"Faith is not the absence of doubt — it is choosing to act on what God has promised, even when you cannot yet see it.\"",
  },
  hope: {
    title: "An Anchor for the Soul",
    scriptureReference: "Romans 5:3-5",
    scriptureText: "Not only so, but we also glory in our sufferings, because we know that suffering produces perseverance; perseverance, character; and character, hope. And hope does not put us to shame, because God's love has been poured out into our hearts through the Holy Spirit, who has been given to us.",
    keyTheme: "Enduring Hope",
    devotionalBody: [
      "Hope is not the same as optimism. Optimism says things will probably work out. Hope says that even if they don't, God is still good, still sovereign, still redeeming. That kind of hope does not disappoint — because it is rooted not in outcomes but in the character of God.",
      "Paul's chain of thought is remarkable: suffering → perseverance → character → hope. We want hope without the process. But genuine hope is forged in the furnace of difficulty. It is not something we conjure up on easy days — it is something that grows through hard ones.",
      "The ground of this hope is not our willpower but the Holy Spirit pouring God's love into our hearts. We cannot manufacture the kind of hope that holds through the darkest nights. But we can receive it — as a gift, moment by moment, from the Spirit of God who dwells within us.",
    ],
    lifeApplication: "In your journal or on paper, write about a past season of difficulty that God brought you through. Let that testimony become fuel for hope in whatever you are facing now.",
    reflectionQuestion: "When you face suffering, is your first instinct to run from it or to look for what God might be producing through it? What would it look like to 'glory in your sufferings' today?",
    guidedPrayer: "Father, I choose hope today — not because my circumstances are easy, but because You are faithful. Thank You for the testimony of Your past faithfulness in my life. Let it build my confidence that You are still at work. Pour Your love into my heart by Your Spirit, so that my hope is unshakeable. In Jesus' name, Amen.",
    shareableQuote: "\"Hope is not a feeling you chase — it is a Person you hold onto. And He never lets go.\"",
  },
  wisdom: {
    title: "Wisdom From Above",
    scriptureReference: "James 1:5",
    scriptureText: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.",
    keyTheme: "Divine Wisdom",
    devotionalBody: [
      "One of the most liberating truths in Scripture is that wisdom is available on request. We do not need to have all the answers. We do not need to figure everything out on our own. We simply need to ask the God who gives generously and without judgment.",
      "The phrase 'without finding fault' is extraordinary. God does not shame us for not knowing. He does not make us feel foolish for asking. When we come to Him confused and uncertain, He meets us with generosity, not condescension.",
      "But this is not a passive wisdom — it is wisdom for living, for deciding, for navigating. The book of James is written to people in trials who need to know what to do. Real wisdom transforms how we act, not just what we know. It shapes our relationships, our priorities, our response to difficulty.",
    ],
    lifeApplication: "Before making any significant decision today, pause and pray specifically: 'God, I need Your wisdom here.' Then wait and listen — in Scripture, through trusted counsel, through peace or unease in your spirit.",
    reflectionQuestion: "In what area of your life do you most need wisdom right now? Have you asked God for it, or have you been relying entirely on your own understanding?",
    guidedPrayer: "Lord, I acknowledge that I do not have all the answers. I need Your wisdom today — for the decisions I'm facing, the relationships I'm navigating, the path ahead that I cannot fully see. You promise to give generously to those who ask. So I ask. Guide my steps, illuminate my mind, and help me to walk in Your ways. Amen.",
    shareableQuote: "\"You don't need to have all the answers. You need to know the One who does — and He gives wisdom generously to all who ask.\"",
  },
};

function matchFallback(topic: string): Devotion {
  const lower = topic.toLowerCase();
  for (const key of Object.keys(FALLBACKS)) {
    if (lower.includes(key)) return FALLBACKS[key];
  }
  return FALLBACKS.peace;
}

export function getTodayFallback(): Devotion {
  const keys = Object.keys(FALLBACKS);
  const dayIndex = new Date().getDay() % keys.length;
  return FALLBACKS[keys[dayIndex]];
}

// ─── Server fetch ─────────────────────────────────────────────────────────────

export async function fetchDevotion(
  topic: string,
  translation: BibleTranslation
): Promise<Devotion> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${SERVER_URL}/api/devotion/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, translation }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    return data as Devotion;
  } catch {
    // Server unavailable — use local fallback silently
    return matchFallback(topic);
  }
}

export { FALLBACKS };
