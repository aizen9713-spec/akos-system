const defaultState = {
  activeDay: getDateKey(),
  dailyMessageIndex: 0,
 player: {
  name: "Ákos",
  title: "THE MAIN CHARACTER",
  arc: "VILLAIN ORIGIN",
  level: 1,
  xp: 50,
  streak: 0,
  bestStreak: 0,
  totalActiveDays: 0,
  streakGoal: 7
},
  stats: {
  str: 0,
  end: 0,
  int: 0,
  dis: 0,
  cha: 0,
  wis: 0,
  virtue: 0
},
statLevels: {
  str: 1,
  end: 1,
  int: 1,
  dis: 1,
  cha: 1,
  wis: 1,
  virtue: 1
},
skills: {
  automotive: {
    name: "Automotive",
    rank: "Intermediate",
    xp: 0
  },

  automotiveElectrical: {
    name: "Automotive Electrical",
    rank: "Beginner",
    xp: 0
  },

  diagnostics: {
    name: "Diagnostics",
    rank: "Intermediate",
    xp: 0
  },

  automotiveAC: {
    name: "Automotive AC",
    rank: "Intermediate",
    xp: 0
  },

  welding: {
    name: "Welding",
    rank: "Beginner",
    xp: 0
  },

  buildingDIY: {
    name: "Building / DIY",
    rank: "Intermediate",
    xp: 0
  },

  appDevelopment: {
    name: "App Development",
    rank: "Beginner",
    xp: 0
  },

  investing: {
    name: "Investing",
    rank: "Intermediate",
    xp: 0
  },

  entrepreneurship: {
    name: "Entrepreneurship",
    rank: "Beginner",
    xp: 0
  },

  communication: {
    name: "Communication",
    rank: "Intermediate",
    xp: 0
  },

  english: {
    name: "English",
    rank: "Developing",
    xp: 0
  },

  firstAid: {
    name: "First Aid",
    rank: "Intermediate",
    xp: 0
  }
},
quests: [
  {
    id: crypto.randomUUID(),
    title: "COMPLETE ONE MEANINGFUL ACTION",
    xp: 10,
    completed: false,
    statRewards: {
      dis: 5
    },
    skillRewards: {}
  },
  {
    id: crypto.randomUUID(),
    title: "30 MIN DEVELOPMENT",
    xp: 10,
    completed: false,
    statRewards: {
      int: 5
    },
    skillRewards: {
      appDevelopment: 5
    }
  },
  {
    id: crypto.randomUUID(),
    title: "20-30 MIN LIGHT CARDIO OR WALK",
    xp: 10,
    completed: false,
    statRewards: {
      end: 5
    },
    skillRewards: {}
  },
  {
    id: crypto.randomUUID(),
    title: "FINANCIAL CHECK",
    xp: 5,
    completed: false,
    statRewards: {
      wis: 5
    },
    skillRewards: {}
  }
  ],
  history: [],
  historyCorrections: [],
  achievements: [],
  baseline: {
  initialized: true,
  initializedAt: "2026-09-13",
  version: "BETA 0.1",
  note: "[SYSTEM INITIALIZATION] Baseline imported. Player profile established. Previous life: recorded. Grind start: NOW.",

  body: {
    weightKg: 93.7,
    waistCm: 100,
    chestCm: 102,
    armCm: {
      relaxed: 35,
      flexed: 38
    },
    thighCm: 60,
    neckCm: 40,
    restingHeartRate: "60-70"
  }
},
settings: {
  guidanceMode: "HIGH",
  units: "metric",
  weekStartsOn: "monday",
  trainingDays: ["tuesday", "thursday", "saturday"],
  bodyCheckInDay: "sunday",
  timezone: "Europe/Budapest"
},
  log: [
    { id: crypto.randomUUID(), text: "[SYSTEM] Day 1 baseline loaded." }
  ]
};

function migrateState(rawState) {
  const migrated = {
    ...structuredClone(defaultState),
    ...rawState,

    player: {
      ...defaultState.player,
      ...(rawState.player || {})
    },

    stats: {
      ...defaultState.stats,
      ...(rawState.stats || {})
    },

    statLevels: {
  ...defaultState.statLevels,
  ...(rawState.statLevels || {})
},

    baseline: {
  ...defaultState.baseline,
  ...(rawState.baseline || {})
},

settings: {
  ...defaultState.settings,
  ...(rawState.settings || {})
},

    skills: Object.fromEntries(
      Object.entries(defaultState.skills).map(([skillKey, defaultSkill]) => [
        skillKey,
        {
          ...defaultSkill,
          ...(rawState.skills?.[skillKey] || {})
        }
      ])
    ),

    quests: (rawState.quests || defaultState.quests).map(quest => ({
      ...quest,
      statRewards:
        quest.statRewards ??
        (
          quest.title === "Complete one meaningful action today"
            ? { dis: 5 }
            : {}
        )
    }))
  };

  if (!migrated.activeDay) {
    migrated.activeDay = getDateKey();
  }

  if (!Array.isArray(migrated.history)) {
    migrated.history = [];
  }

if (!Array.isArray(migrated.historyCorrections)) {
  migrated.historyCorrections = [];
}

  if (!Array.isArray(migrated.achievements)) {
    migrated.achievements = [];
  }

  if (!Number.isInteger(migrated.dailyMessageIndex)) {
  migrated.dailyMessageIndex = 0;
}

  return migrated;
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    const loaded = JSON.parse(saved);
    return migrateState(loaded);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  state.lastSavedAt = new Date().toISOString();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}