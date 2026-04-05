const SAMPLE_REVIEW_AUTHORS = [
  "Armaan K",
  "Sneha P",
  "Jason R",
  "Ishita V",
  "Marcus D",
  "Aarav S",
  "Elena M",
  "Kunal B",
  "Noah T",
  "Meera J",
];

const GAME_SPECIFIC_REVIEW_TEMPLATES = {
  "cyberpunk 2077": [
    "Night City ka vibe GAME_TITLE mein next level lagta hai, side content bhi kaafi engaging hai.",
    "GAME_TITLE ab kaafi polished feel hota hai, gunplay smooth hai aur world explore karne mein maza aata hai.",
    "Build variety in GAME_TITLE genuinely fun hai, har playstyle thoda alag feel hota hai.",
  ],
  "elden ring": [
    "GAME_TITLE ki exploration bahut rewarding hai, har area mein kuch na kuch naya milta hai.",
    "Boss fights in GAME_TITLE tough hain but mostly fair lagte hain, isi wajah se wins aur satisfying feel hoti hain.",
    "Mujhe GAME_TITLE ka open approach bahut pasand aaya, apne pace pe world tackle kar sakte ho.",
  ],
  "gta v": [
    "GAME_TITLE abhi bhi un games mein se hai jise kabhi bhi open karo aur instant fun mil jata hai.",
    "Map, missions aur soundtrack in GAME_TITLE abhi bhi kaafi solid lagte hain.",
    "GAME_TITLE mein story moments aur random chaos ka mix bahut entertaining hai.",
  ],
};

const GENERIC_REVIEW_TEMPLATES = [
  "The visuals in GAME_TITLE are excellent aur gameplay loop kaafi der tak fun rehta hai.",
  "Maine GAME_TITLE sale mein liya tha but honestly library ke best purchases mein se ek nikla.",
  "GAME_TITLE ka atmosphere strong hai, controls smooth hain, aur replay value bhi achhi hai.",
  "Main GAME_TITLE par baar baar wapas aata hoon because missions polished aur rewarding lagti hain.",
  "Performance solid hai and GAME_TITLE first hour se hi premium feel deta hai.",
  "Agar tumhe cinematic action aur good progression pasand hai to GAME_TITLE worth it hai.",
  "GAME_TITLE unexpectedly bahut addictive nikla and overall balance bhi kaafi achha laga.",
  "Soundtrack, presentation aur overall experience in GAME_TITLE kaafi satisfying hai.",
  "Story engaging hai aur GAME_TITLE ka pacing mostly tight feel hota hai.",
  "GAME_TITLE casual session ke liye bhi achha hai aur long grind ke liye bhi.",
];

function normalizeTitle(title) {
  return (title || "").trim().toLowerCase();
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function shuffleFromSeed(items, seedKey) {
  const shuffled = [...items];
  let seed = hashString(seedKey) || 1;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function buildSampleReviews(gameTitle, existingReviewCount = 0) {
  const normalizedTitle = normalizeTitle(gameTitle);
  const specificTemplates =
    GAME_SPECIFIC_REVIEW_TEMPLATES[normalizedTitle] || [];
  const allTemplates = shuffleFromSeed(
    [...specificTemplates, ...GENERIC_REVIEW_TEMPLATES],
    `${normalizedTitle}-${existingReviewCount}-templates`,
  );
  const shuffledAuthors = shuffleFromSeed(
    SAMPLE_REVIEW_AUTHORS,
    `${normalizedTitle}-${existingReviewCount}-authors`,
  );
  const targetCount = 8;
  const fakeCount = Math.max(0, targetCount - existingReviewCount);

  return allTemplates.slice(0, fakeCount).map((template, index) => ({
    id: `sample-${normalizedTitle || "game"}-${index}`,
    author: shuffledAuthors[index % shuffledAuthors.length],
    rating: 5 - (index % 2),
    comment: template.replaceAll("GAME_TITLE", gameTitle || "this game"),
    isSample: true,
  }));
}
