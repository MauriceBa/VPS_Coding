const STORAGE_KEY = 'skitycoon_v3_main';
const SAVE_VERSION = 3;
const TICK_MS = 1000;
const HOURS_PER_TICK = 1;
const OFFLINE_CAP_HOURS = 8 * 24;

const REGION_DEFS = {
  alpine_meadow: {
    id: 'alpine_meadow',
    name: 'Almwiese',
    description: 'Kleines Startgebiet mit viel Anfängerpotenzial und niedrigen Einstiegskosten.',
    unlockCost: 0,
    baseDemand: 26,
    appeal: 5,
    altitude: 1280,
    familyBias: 1.28,
    expertBias: 0.82,
    luxuryBias: 0.8,
    snowBase: 58,
    specialty: 'Familien & Einstieg'
  },
  adlerhorn: {
    id: 'adlerhorn',
    name: 'Adlerhorn',
    description: 'Windiger Sportberg für rote, schwarze und schnelle Liftachsen.',
    unlockCost: 90000,
    baseDemand: 34,
    appeal: 11,
    altitude: 2120,
    familyBias: 0.92,
    expertBias: 1.26,
    luxuryBias: 0.94,
    snowBase: 78,
    specialty: 'Sport & Freeride'
  },
  waldtal: {
    id: 'waldtal',
    name: 'Waldtal',
    description: 'Geschütztes Tal mit blauen Pisten, Komfort-Fokus und starken Sommerchancen.',
    unlockCost: 175000,
    baseDemand: 42,
    appeal: 15,
    altitude: 1660,
    familyBias: 1.3,
    expertBias: 0.94,
    luxuryBias: 1.04,
    snowBase: 66,
    specialty: 'Komfort & Familienurlaub'
  },
  steinplatte: {
    id: 'steinplatte',
    name: 'Steinplatte',
    description: 'Technisch anspruchsvoll, ideal für Rennen, Training und ambitionierte Fahrer.',
    unlockCost: 275000,
    baseDemand: 52,
    appeal: 20,
    altitude: 2360,
    familyBias: 0.9,
    expertBias: 1.4,
    luxuryBias: 0.98,
    snowBase: 82,
    specialty: 'Racing & Performance'
  },
  gletscherkrone: {
    id: 'gletscherkrone',
    name: 'Gletscherkrone',
    description: 'Premium-Gletscher mit Schneegarantie, hohem Prestige und riesigem Endgame.',
    unlockCost: 430000,
    baseDemand: 62,
    appeal: 26,
    altitude: 3010,
    familyBias: 0.96,
    expertBias: 1.16,
    luxuryBias: 1.34,
    snowBase: 96,
    specialty: 'Luxus & Schneesicherheit'
  }
};

const STRUCTURES = {
  conveyor: {
    id: 'conveyor', category: 'lift', name: 'Förderband', icon: '🟦',
    desc: 'Für Skischulen und Anfängerbereiche.', cost: 4500, buildHours: 6,
    liftCap: 28, upkeep: 50, prestige: 1, staff: 1, power: 1, familyAppeal: 6
  },
  draglift: {
    id: 'draglift', category: 'lift', name: 'Schlepplift', icon: '⛓️',
    desc: 'Günstiger Standardlift mit solidem Durchsatz.', cost: 10000, buildHours: 12,
    liftCap: 62, upkeep: 120, prestige: 3, staff: 2, power: 2, budgetAppeal: 4
  },
  chairlift: {
    id: 'chairlift', category: 'lift', name: '4er-Sessellift', icon: '🪑',
    desc: 'Komfortabler Allround-Lift fürs Midgame.', cost: 24000, buildHours: 24,
    liftCap: 128, upkeep: 260, prestige: 7, staff: 4, power: 5, comfort: 4, sportAppeal: 4
  },
  highspeed: {
    id: 'highspeed', category: 'lift', name: '6er Highspeed', icon: '🚡',
    desc: 'Bringt Durchsatz, Komfort und modernes Resort-Feeling.', cost: 52000, buildHours: 34,
    liftCap: 220, upkeep: 480, prestige: 13, staff: 6, power: 9, comfort: 7, sportAppeal: 7,
    requires: { research: 'express_lifts' }
  },
  gondola: {
    id: 'gondola', category: 'lift', name: 'Gondelbahn', icon: '🚠',
    desc: 'Prestige-Lift für große Massen und Premium-Gäste.', cost: 82000, buildHours: 48,
    liftCap: 310, upkeep: 760, prestige: 20, staff: 8, power: 12, comfort: 10, luxury: 8,
    requires: { research: 'express_lifts' }
  },
  funitel: {
    id: 'funitel', category: 'lift', name: 'Funitel', icon: '🛰️',
    desc: 'Windstabiler Gipfellift für späte Hochlagen.', cost: 145000, buildHours: 68,
    liftCap: 420, upkeep: 1180, prestige: 32, staff: 10, power: 18, comfort: 12, luxury: 10, sportAppeal: 10,
    requires: { research: 'alpine_engineering', minRegionAltitude: 2200 }
  },
  parking: {
    id: 'parking', category: 'facility', name: 'Parkplatz', icon: '🅿️',
    desc: 'Mehr Tagesgäste, bessere Erreichbarkeit.', cost: 3500, buildHours: 5,
    serviceCap: 44, upkeep: 35, prestige: 1, staff: 1, comfort: 1, budgetAppeal: 7
  },
  rental: {
    id: 'rental', category: 'facility', name: 'Ski-Verleih', icon: '🎿',
    desc: 'Hilft Anfängern und steigert Umsatz pro Gast.', cost: 5500, buildHours: 8,
    upkeep: 65, prestige: 2, staff: 2, comfort: 4, spend: 4, familyAppeal: 6, budgetAppeal: 2
  },
  skischool: {
    id: 'skischool', category: 'facility', name: 'Skischule', icon: '🧑‍🏫',
    desc: 'Familienmagnet und starker Anfänger-Boost.', cost: 9000, buildHours: 10,
    upkeep: 85, prestige: 3, staff: 4, comfort: 4, familyAppeal: 10, spend: 2
  },
  cafe: {
    id: 'cafe', category: 'facility', name: 'Berghütte', icon: '☕',
    desc: 'Steigert Komfort und Zusatzumsätze.', cost: 7500, buildHours: 9,
    upkeep: 72, prestige: 3, staff: 3, comfort: 5, spend: 5
  },
  restaurant: {
    id: 'restaurant', category: 'facility', name: 'Panorama-Restaurant', icon: '🍽️',
    desc: 'Mehr Premiumumsatz und hohe Aufenthaltsqualität.', cost: 16000, buildHours: 15,
    upkeep: 120, prestige: 6, staff: 5, comfort: 7, spend: 8, luxury: 3
  },
  patrol: {
    id: 'patrol', category: 'facility', name: 'Bergrettung', icon: '⛑️',
    desc: 'Senkt Unfallrisiko und stabilisiert Reputation.', cost: 11500, buildHours: 12,
    upkeep: 95, prestige: 4, staff: 4, safety: 11
  },
  clinic: {
    id: 'clinic', category: 'facility', name: 'Rettungsstation', icon: '🏥',
    desc: 'Großer Sicherheitssprung für stark frequentierte Berge.', cost: 26000, buildHours: 20,
    upkeep: 170, prestige: 8, staff: 6, safety: 20,
    requires: { research: 'safety_program' }
  },
  snowmaking: {
    id: 'snowmaking', category: 'facility', name: 'Beschneiungszentrale', icon: '❄️',
    desc: 'Glättet schlechte Wetterphasen und verlängert die Saison.', cost: 18000, buildHours: 15,
    upkeep: 180, prestige: 5, staff: 2, snowSupport: 14, power: 5, water: 6
  },
  reservoir: {
    id: 'reservoir', category: 'facility', name: 'Wasserreservoir', icon: '💧',
    desc: 'Verbessert Beschneiung und Effizienz in warmen Tagen.', cost: 22000, buildHours: 18,
    upkeep: 110, prestige: 5, staff: 2, snowSupport: 8, eco: 4,
    requires: { research: 'snow_science' }
  },
  maint: {
    id: 'maint', category: 'facility', name: 'Werkstatt', icon: '🧰',
    desc: 'Weniger Störungen und niedrigere Betriebskosten.', cost: 14000, buildHours: 14,
    upkeep: 80, prestige: 4, staff: 3, maintenance: 10, eco: 2
  },
  hotel: {
    id: 'hotel', category: 'facility', name: 'Berghotel', icon: '🏨',
    desc: 'Mehrtägige Gäste, Premiumumsatz und Komfort.', cost: 34000, buildHours: 28,
    serviceCap: 50, hotelCap: 44, upkeep: 250, prestige: 11, staff: 7, comfort: 9, spend: 10, luxury: 8,
    requires: { research: 'hospitality' }
  },
  luxury_lodge: {
    id: 'luxury_lodge', category: 'facility', name: 'Luxury Lodge', icon: '🛎️',
    desc: 'Massiver Luxus-Magnet für späte Premium-Gebiete.', cost: 76000, buildHours: 38,
    hotelCap: 60, upkeep: 420, prestige: 18, staff: 10, comfort: 14, spend: 16, luxury: 14,
    requires: { research: 'luxury_brand' }
  },
  spa: {
    id: 'spa', category: 'facility', name: 'Spa & Wellness', icon: '🧖',
    desc: 'Hohe Zufriedenheit und starke Luxus-Nachfrage.', cost: 46000, buildHours: 30,
    upkeep: 215, prestige: 10, staff: 5, comfort: 12, spend: 12, luxury: 10,
    requires: { research: 'hospitality' }
  },
  shuttle: {
    id: 'shuttle', category: 'facility', name: 'Tal-Shuttle', icon: '🚌',
    desc: 'Erhöht Verbundwert und Erreichbarkeit mehrerer Resorts.', cost: 19000, buildHours: 14,
    serviceCap: 28, upkeep: 130, prestige: 5, staff: 3, comfort: 4, connectivity: 1,
    requires: { research: 'networking' }
  },
  solar: {
    id: 'solar', category: 'facility', name: 'Solarstation', icon: '🔋',
    desc: 'Senkt Energiekosten und stärkt Nachhaltigkeit.', cost: 26000, buildHours: 18,
    upkeep: 55, prestige: 7, staff: 1, eco: 8,
    requires: { research: 'green_energy' }
  },
  race_center: {
    id: 'race_center', category: 'facility', name: 'Rennzentrum', icon: '🏁',
    desc: 'Sport-Magnet, Trainingslager und Event-Loc.', cost: 38000, buildHours: 26,
    upkeep: 210, prestige: 12, staff: 5, sportAppeal: 12, spend: 6,
    requires: { research: 'race_series' }
  },
  event_arena: {
    id: 'event_arena', category: 'facility', name: 'Event Arena', icon: '🎪',
    desc: 'Erhöht Festival- und Marketingwirkung deutlich.', cost: 50000, buildHours: 24,
    upkeep: 240, prestige: 14, staff: 6, comfort: 6, luxury: 4, eventPower: 1,
    requires: { research: 'festival_ops' }
  }
};

const SLOPES = {
  bunny: {
    id: 'bunny', name: 'Anfängerhang', icon: '🟢', desc: 'Sehr sicher und ideal für Einsteiger.',
    cost: 2500, buildHours: 5, slopeCap: 30, appeal: 4, risk: 0.22, grooming: 18, familyAppeal: 10, expertAppeal: -2
  },
  blue: {
    id: 'blue', name: 'Blaue Piste', icon: '🔵', desc: 'Breite Wohlfühlabfahrt für fast alle.',
    cost: 7000, buildHours: 8, slopeCap: 70, appeal: 7, risk: 0.35, grooming: 38, familyAppeal: 6, expertAppeal: 1
  },
  red: {
    id: 'red', name: 'Rote Piste', icon: '🔴', desc: 'Sportliche Standardpiste mit gutem Durchsatz.',
    cost: 14500, buildHours: 12, slopeCap: 96, appeal: 12, risk: 0.56, grooming: 63, familyAppeal: -1, expertAppeal: 8
  },
  black: {
    id: 'black', name: 'Schwarze Piste', icon: '⚫', desc: 'Rufbringer für Könner, aber riskant.',
    cost: 27000, buildHours: 18, slopeCap: 108, appeal: 18, risk: 1.06, grooming: 92, familyAppeal: -8, expertAppeal: 15,
    requires: { minRegionAltitude: 1900 }
  },
  park: {
    id: 'park', name: 'Snowpark', icon: '🏂', desc: 'Anziehungspunkt für junge Zielgruppen.',
    cost: 22000, buildHours: 16, slopeCap: 78, appeal: 17, risk: 0.92, grooming: 86, familyAppeal: -2, expertAppeal: 12,
    requires: { research: 'park_design' }
  },
  freeride: {
    id: 'freeride', name: 'Freeride-Zone', icon: '🏔️', desc: 'Hoher Expertenreiz bei starkem Wetterrisiko.',
    cost: 32000, buildHours: 20, slopeCap: 84, appeal: 21, risk: 1.25, grooming: 40, familyAppeal: -10, expertAppeal: 20,
    requires: { research: 'alpine_engineering', minRegionAltitude: 2000 }
  },
  night: {
    id: 'night', name: 'Nachtpiste', icon: '🌙', desc: 'Zusatzumsatz und Abwechslung für urbane Resorts.',
    cost: 21000, buildHours: 14, slopeCap: 52, appeal: 13, risk: 0.72, grooming: 58, familyAppeal: 2, expertAppeal: 5,
    requires: { research: 'night_ops' }
  },
  race: {
    id: 'race', name: 'Rennstrecke', icon: '🎿', desc: 'Für Trainingslager, Rennen und Prestige.',
    cost: 35000, buildHours: 22, slopeCap: 88, appeal: 20, risk: 0.88, grooming: 84, familyAppeal: -4, expertAppeal: 16,
    requires: { research: 'race_series' }
  }
};

const RESEARCH = {
  fast_grooming: {
    id: 'fast_grooming', name: 'Digitale Pistenpflege', cost: 12000,
    desc: 'Pistenpflege wird günstiger und Gäste merken die Qualität.', effects: { groomingCostMult: -0.16, satisfactionFlat: 3 }
  },
  marketing: {
    id: 'marketing', name: 'Performance-Marketing', cost: 15000,
    desc: 'Mehr Nachfrage und stärkere Kampagnen.', effects: { demandMult: 0.12, campaignBonus: 0.18 }
  },
  safety_program: {
    id: 'safety_program', name: 'Sicherheitsprogramm', cost: 18000,
    desc: 'Weniger Unfälle und höhere Basis-Sicherheit.', effects: { safetyFlat: 10 }
  },
  express_lifts: {
    id: 'express_lifts', name: 'Express-Lifttechnik', cost: 34000,
    desc: 'Schaltet Highspeed-Lifte und Gondeln frei.', effects: { liftCapMult: 0.12 }
  },
  hospitality: {
    id: 'hospitality', name: 'Hotel- & Hospitality-Standards', cost: 30000,
    desc: 'Hotels, Spa und bessere Zusatzumsätze.', effects: { spendMult: 0.12, satisfactionFlat: 2 }
  },
  networking: {
    id: 'networking', name: 'Resort-Verbundsysteme', cost: 28000,
    desc: 'Shuttles und stärkere Mehrgebiets-Nachfrage.', effects: { multiRegionDemand: 0.1 }
  },
  green_energy: {
    id: 'green_energy', name: 'Nachhaltige Energie', cost: 34000,
    desc: 'Reduziert Kosten und stärkt den Ruf.', effects: { costMult: -0.08, repDaily: 0.35 }
  },
  park_design: {
    id: 'park_design', name: 'Snowpark-Design', cost: 25000,
    desc: 'Schaltet Snowparks frei.', effects: { demandMult: 0.05 }
  },
  snow_science: {
    id: 'snow_science', name: 'Schnee-Science', cost: 28000,
    desc: 'Bessere Beschneiung und höhere Schneestabilität.', effects: { snowRetention: 6 }
  },
  alpine_engineering: {
    id: 'alpine_engineering', name: 'Alpine Ingenieurkunst', cost: 52000,
    desc: 'Schaltet Funitel und Freeride-Hochlagen frei.', effects: { liftCapMult: 0.08, demandMult: 0.04 }
  },
  night_ops: {
    id: 'night_ops', name: 'Nachtbetrieb', cost: 26000,
    desc: 'Schaltet Nachtpisten frei und steigert Tagesumsatz.', effects: { spendMult: 0.04 }
  },
  race_series: {
    id: 'race_series', name: 'Race Series', cost: 42000,
    desc: 'Rennzentrum und Rennstrecke werden möglich.', effects: { demandMult: 0.06, sportSpend: 5 }
  },
  festival_ops: {
    id: 'festival_ops', name: 'Festival Operations', cost: 45000,
    desc: 'Stärkere Events und bessere Arena-Auslastung.', effects: { eventDemand: 0.15 }
  },
  luxury_brand: {
    id: 'luxury_brand', name: 'Luxury Brand', cost: 60000,
    desc: 'Schaltet Luxury Lodges frei und hebt Luxusnachfrage.', effects: { luxuryDemand: 0.18, spendMult: 0.08 }
  }
};

const GOALS = [
  { id: 'cash_100k', label: 'Erreiche 100.000 €', rewardMoney: 12000, rewardRep: 4, check: s => s.money >= 100000 },
  { id: 'rep_100', label: 'Erreiche 100 Reputation', rewardMoney: 18000, rewardRep: 6, check: s => s.reputation >= 100 },
  { id: 'regions_2', label: 'Schalte ein zweites Gebiet frei', rewardMoney: 10000, rewardRep: 3, check: s => getUnlockedRegions(s).length >= 2 },
  { id: 'gondola_1', label: 'Baue eine Gondelbahn', rewardMoney: 16000, rewardRep: 5, check: s => totalStructure(s, 'gondola') >= 1 },
  { id: 'hotel_2', label: 'Betreibe zwei Hotels', rewardMoney: 22000, rewardRep: 6, check: s => totalStructure(s, 'hotel') >= 2 },
  { id: 'park_1', label: 'Errichte einen Snowpark', rewardMoney: 9000, rewardRep: 3, check: s => totalSlope(s, 'park') >= 1 },
  { id: 'staff_40', label: 'Stelle 40 Mitarbeiter ein', rewardMoney: 15000, rewardRep: 4, check: s => s.staff >= 40 },
  { id: 'season_passes', label: 'Verkaufe 200 Saisonpässe', rewardMoney: 24000, rewardRep: 6, check: s => s.seasonPasses >= 200 },
  { id: 'luxury', label: 'Baue eine Luxury Lodge', rewardMoney: 26000, rewardRep: 8, check: s => totalStructure(s, 'luxury_lodge') >= 1 },
  { id: 'prestige_1', label: 'Gründe deine erste Resort-Gruppe', rewardMoney: 30000, rewardRep: 0, check: s => s.prestige >= 1 }
];

const AWARDS = [
  { id: 'family_star', label: 'Familienstar', check: s => totalStructure(s, 'skischool') >= 2 && totalSlope(s, 'bunny') >= 2 },
  { id: 'skyline', label: 'Skyline Award', check: s => totalStructure(s, 'gondola') + totalStructure(s, 'funitel') >= 2 },
  { id: 'safety_first', label: 'Safety First', check: s => getUnlockedRegions(s).some(r => r.satisfaction >= 90 && r.lastAccidents === 0) },
  { id: 'sport_elite', label: 'Sport Elite', check: s => totalSlope(s, 'black') + totalSlope(s, 'race') + totalSlope(s, 'freeride') >= 4 },
  { id: 'wellness_peak', label: 'Wellness Peak', check: s => totalStructure(s, 'spa') + totalStructure(s, 'luxury_lodge') >= 2 },
  { id: 'green_resort', label: 'Green Resort', check: s => totalStructure(s, 'solar') >= 2 && !!s.research.green_energy }
];

const WEATHER_TYPES = [
  { key: 'bluebird', label: 'Blauer Himmel', demand: 1.16, snow: -2, risk: 0.88, note: 'Perfekte Sicht und starke Nachfrage.' },
  { key: 'cloudy', label: 'Bewölkt', demand: 1.0, snow: 0, risk: 1.0, note: 'Solider Standardtag in den Bergen.' },
  { key: 'snowfall', label: 'Schneefall', demand: 1.05, snow: 10, risk: 1.06, note: 'Pulverschnee lockt Fans an.' },
  { key: 'windy', label: 'Windig', demand: 0.88, snow: -1, risk: 1.12, note: 'Hohe Bergachsen leiden unter Wind.' },
  { key: 'warm', label: 'Warmfront', demand: 0.8, snow: -13, risk: 1.08, note: 'Schmelze drückt Qualität und Andrang.' },
  { key: 'storm', label: 'Sturm', demand: 0.62, snow: 5, risk: 1.28, note: 'Schwieriger Betriebstag mit Ausfallrisiko.' }
];

const EVENT_POOL = [
  { id: 'holiday_rush', title: 'Ferienansturm', desc: 'Ferien und Wochenenden füllen die Resorts.', durationDays: 3, effects: { demandMult: 0.22 } },
  { id: 'powder_alarm', title: 'Pulverschnee-Alarm', desc: 'Frischer Schnee sorgt für Begeisterung.', durationDays: 2, effects: { demandMult: 0.18, snowFlat: 16 } },
  { id: 'energy_spike', title: 'Energiepreise steigen', desc: 'Lift- und Beschneiungsbetrieb werden teurer.', durationDays: 3, effects: { costMult: 0.16 } },
  { id: 'influencer_trip', title: 'Influencer-Skitrip', desc: 'Reichweitenstarke Creator pushen dein Resort.', durationDays: 4, effects: { demandMult: 0.14, repDaily: 1.2 } },
  { id: 'safety_audit', title: 'Sicherheitsinspektion', desc: 'Gute Prozesse wirken sich stark aus.', durationDays: 2, effects: { safetyFlat: 8 } },
  { id: 'luxury_week', title: 'Luxury Week', desc: 'Premium-Gäste geben besonders viel Geld aus.', durationDays: 3, effects: { luxuryDemand: 0.18 } },
  { id: 'student_week', title: 'Studentenwoche', desc: 'Preisbewusste Gäste suchen günstige Tickets.', durationDays: 3, effects: { budgetDemand: 0.2 } },
  { id: 'race_camp', title: 'Trainingslager', desc: 'Sportgäste und Rennteams reisen an.', durationDays: 3, effects: { sportDemand: 0.18 } },
  { id: 'family_festival', title: 'Familienfestival', desc: 'Skischulen und leichte Pisten boomen.', durationDays: 2, effects: { familyDemand: 0.22 } }
];

let state = createInitialState();
let loopHandle = null;

function createRegion(id, unlocked = false) {
  return {
    id,
    unlocked,
    snow: REGION_DEFS[id].snowBase,
    guestsToday: 0,
    lastRevenue: 0,
    lastCosts: 0,
    lastProfit: 0,
    lastAccidents: 0,
    lastSegments: { family: 0, sport: 0, luxury: 0, budget: 0 },
    satisfaction: 68,
    queue: [],
    assets: Object.fromEntries(Object.keys(STRUCTURES).map(key => [key, 0])),
    slopes: Object.fromEntries(Object.keys(SLOPES).map(key => [key, 0])),
    ops: {
      groomingBoostHours: 0,
      safetyBoostHours: 0,
      campaignBoostHours: 0,
      festivalBoostHours: 0
    }
  };
}

function createInitialState() {
  const regions = {};
  Object.keys(REGION_DEFS).forEach((id, index) => {
    regions[id] = createRegion(id, index === 0);
  });
  regions.alpine_meadow.assets.parking = 1;
  regions.alpine_meadow.assets.rental = 1;
  regions.alpine_meadow.assets.conveyor = 1;
  regions.alpine_meadow.assets.cafe = 1;
  regions.alpine_meadow.assets.skischool = 1;
  regions.alpine_meadow.slopes.bunny = 1;
  regions.alpine_meadow.slopes.blue = 1;

  return {
    version: SAVE_VERSION,
    lastTimestamp: Date.now(),
    speed: 1,
    day: 1,
    hour: 8,
    seasonDay: 1,
    seasonYear: 1,
    money: 52000,
    reputation: 18,
    prestige: 0,
    staff: 20,
    debt: 0,
    seasonPasses: 24,
    training: { service: 0, safety: 0, ops: 0, marketing: 0 },
    goalsClaimed: {},
    news: [{ day: 1, text: 'SkiTycoon V3 gestartet. Du leitest jetzt ein echtes Resort-Imperium mit Events, Zielen, Finanzen und Segmenten.', type: 'info' }],
    activeEvents: [],
    weatherKey: 'bluebird',
    ticketMode: 'standard',
    research: {},
    ui: { tab: 'overview', region: 'alpine_meadow' },
    regions
  };
}

function getUnlockedRegions(s = state) {
  return Object.values(s.regions).filter(region => region.unlocked);
}

function totalStructure(s, structureId) {
  return getUnlockedRegions(s).reduce((sum, region) => sum + (region.assets[structureId] || 0), 0);
}

function totalSlope(s, slopeId) {
  return getUnlockedRegions(s).reduce((sum, region) => sum + (region.slopes[slopeId] || 0), 0);
}

function getWeatherDef() {
  return WEATHER_TYPES.find(item => item.key === state.weatherKey) || WEATHER_TYPES[0];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(value));
}

function formatInt(value) {
  return new Intl.NumberFormat('de-DE').format(Math.round(value));
}

function formatHours(hours) {
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return days > 0 ? `${days}T ${rest}h` : `${rest}h`;
}

function getResearchEffect(key) {
  let total = 0;
  Object.entries(state.research).forEach(([id, owned]) => {
    if (!owned) return;
    total += RESEARCH[id]?.effects?.[key] || 0;
  });
  return total;
}

function getActiveEffect(key) {
  return state.activeEvents.reduce((sum, event) => sum + (event.effects[key] || 0), 0);
}

function getTicketConfig() {
  if (state.ticketMode === 'value') return { price: 29, demand: 1.12, family: 1.1, sport: 0.95, luxury: 0.82, budget: 1.2, satisfaction: 3 };
  if (state.ticketMode === 'premium') return { price: 48, demand: 0.88, family: 0.9, sport: 1.0, luxury: 1.2, budget: 0.7, satisfaction: -2 };
  return { price: 37, demand: 1.0, family: 1.0, sport: 1.0, luxury: 1.0, budget: 1.0, satisfaction: 0 };
}

function getBuildSpeedMult() {
  return 1 + state.prestige * 0.05 + state.training.ops * 0.03;
}

function sumRegionStat(region, key) {
  return Object.entries(region.assets).reduce((sum, [id, count]) => sum + (STRUCTURES[id]?.[key] || 0) * count, 0);
}

function sumSlopeStat(region, key) {
  return Object.entries(region.slopes).reduce((sum, [id, count]) => sum + (SLOPES[id]?.[key] || 0) * count, 0);
}

function getStaffNeed(region) {
  return sumRegionStat(region, 'staff');
}

function getGlobalStaffNeed() {
  return getUnlockedRegions().reduce((sum, region) => sum + getStaffNeed(region), 0);
}

function getStaffFactor() {
  const need = getGlobalStaffNeed();
  if (need <= 0) return 1;
  const factor = state.staff / need;
  return clamp(factor, 0.55, 1.08);
}

function isAvailableInRegion(regionId, kind, itemId) {
  const region = state.regions[regionId];
  if (!region?.unlocked) return false;
  const item = kind === 'structure' ? STRUCTURES[itemId] : SLOPES[itemId];
  if (!item) return false;
  const req = item.requires || {};
  if (req.research && !state.research[req.research]) return false;
  if (req.minRegionAltitude && REGION_DEFS[regionId].altitude < req.minRegionAltitude) return false;
  return true;
}

function queueProject(regionId, kind, itemId) {
  const region = state.regions[regionId];
  const item = kind === 'structure' ? STRUCTURES[itemId] : SLOPES[itemId];
  if (!region || !item || !region.unlocked) return;
  if (!isAvailableInRegion(regionId, kind, itemId)) return;
  if (state.money < item.cost) return;
  state.money -= item.cost;
  const totalHours = Math.max(2, Math.round(item.buildHours / getBuildSpeedMult()));
  region.queue.push({ kind, id: itemId, name: item.name, totalHours, hoursLeft: totalHours, cost: item.cost });
  addNews(`${REGION_DEFS[regionId].name}: Bau gestartet – ${item.name}.`, 'build');
}

function completeProject(region, project) {
  if (project.kind === 'structure') region.assets[project.id] += 1;
  else region.slopes[project.id] += 1;
  addNews(`${REGION_DEFS[region.id].name}: ${project.name} fertiggestellt.`, 'success');
}

function progressQueues(hours) {
  getUnlockedRegions().forEach(region => {
    if (!region.queue.length) return;
    region.queue[0].hoursLeft -= hours;
    while (region.queue.length && region.queue[0].hoursLeft <= 0) {
      const finished = region.queue.shift();
      completeProject(region, finished);
      if (region.queue.length && finished.hoursLeft < 0) {
        region.queue[0].hoursLeft += finished.hoursLeft;
      }
    }
  });
}

function getRegionMetrics(region) {
  const def = REGION_DEFS[region.id];
  const ticket = getTicketConfig();
  const weather = getWeatherDef();
  const liftCap = sumRegionStat(region, 'liftCap') * (1 + getResearchEffect('liftCapMult'));
  const slopeCap = sumSlopeStat(region, 'slopeCap');
  const serviceCap = 24 + sumRegionStat(region, 'serviceCap') + sumRegionStat(region, 'hotelCap') * 0.6;
  const baseCapacity = Math.max(0, Math.min(liftCap || 0, slopeCap || 0, serviceCap || 0));

  const comfort = sumRegionStat(region, 'comfort') + state.training.service * 2 + state.prestige * 2 + getActiveEffect('comfortFlat');
  const safety = sumRegionStat(region, 'safety') + state.training.safety * 4 + getResearchEffect('safetyFlat') + getActiveEffect('safetyFlat') + (region.ops.safetyBoostHours > 0 ? 10 : 0);
  const spendBase = sumRegionStat(region, 'spend') * (1 + getResearchEffect('spendMult'));
  const luxury = sumRegionStat(region, 'luxury');
  const familyAppeal = sumRegionStat(region, 'familyAppeal') + sumSlopeStat(region, 'familyAppeal');
  const expertAppeal = sumRegionStat(region, 'sportAppeal') + sumSlopeStat(region, 'expertAppeal');
  const budgetAppeal = sumRegionStat(region, 'budgetAppeal');
  const maintenance = sumRegionStat(region, 'maintenance');
  const eventPower = sumRegionStat(region, 'eventPower');
  const eco = sumRegionStat(region, 'eco');
  const snowSupport = sumRegionStat(region, 'snowSupport') + getActiveEffect('snowFlat') + getResearchEffect('snowRetention');

  const snowFactor = clamp((region.snow + snowSupport) / 85, 0.45, 1.34);
  const staffFactor = getStaffFactor();
  const windPenalty = (weather.key === 'windy' || weather.key === 'storm') ? (def.altitude > 2200 ? 0.8 : 0.92) : 1;
  const capacity = Math.round(baseCapacity * staffFactor * windPenalty);

  const demandBase = (def.baseDemand + state.reputation * 0.3 + def.appeal + state.prestige * 8)
    * ticket.demand
    * weather.demand
    * (1 + getResearchEffect('demandMult'))
    * (1 + getActiveEffect('demandMult'))
    * (1 + (getUnlockedRegions().length > 1 ? getResearchEffect('multiRegionDemand') : 0));

  const festivalBoost = region.ops.festivalBoostHours > 0 ? (0.15 + getResearchEffect('eventDemand') + eventPower * 0.04) : 0;
  const campaignBoost = region.ops.campaignBoostHours > 0 ? (0.16 + getResearchEffect('campaignBonus') + state.training.marketing * 0.03) : 0;
  const allDemandBoost = 1 + festivalBoost + campaignBoost;

  const familyDemand = Math.max(0, (demandBase * def.familyBias + familyAppeal * 1.1 + comfort * 0.22 + state.seasonPasses * 0.04) * ticket.family * (1 + getActiveEffect('familyDemand')));
  const sportDemand = Math.max(0, (demandBase * def.expertBias + expertAppeal * 1.12 + def.altitude * 0.004 + state.training.ops * 1.6) * ticket.sport * (1 + getActiveEffect('sportDemand')));
  const luxuryDemand = Math.max(0, (6 + demandBase * def.luxuryBias * 0.4 + luxury * 1.3 + comfort * 0.4 + state.reputation * 0.07 + state.prestige * 2.5) * ticket.luxury * (1 + getResearchEffect('luxuryDemand') + getActiveEffect('luxuryDemand')));
  const budgetDemand = Math.max(0, (10 + demandBase * 0.5 + budgetAppeal * 1.0 + serviceCap * 0.04) * ticket.budget * (1 + getActiveEffect('budgetDemand')));

  const rawGuests = (familyDemand + sportDemand + luxuryDemand + budgetDemand) * snowFactor * allDemandBoost;
  const guests = capacity > 0 ? Math.max(0, Math.round(Math.min(capacity, rawGuests))) : 0;
  const rawSum = familyDemand + sportDemand + luxuryDemand + budgetDemand || 1;
  const familyGuests = Math.round(guests * familyDemand / rawSum);
  const sportGuests = Math.round(guests * sportDemand / rawSum);
  const luxuryGuests = Math.round(guests * luxuryDemand / rawSum);
  const budgetGuests = Math.max(0, guests - familyGuests - sportGuests - luxuryGuests);

  const waitPressure = capacity > 0 ? guests / capacity : 2;
  const accidentRisk = (sumSlopeStat(region, 'risk') + weather.risk + (region.ops.groomingBoostHours > 0 ? -0.08 : 0)) * (1 - safety / 120);
  const accidents = Math.max(0, Math.round(guests * accidentRisk / 110));

  const satisfaction = clamp(
    63
      + comfort * 0.85
      + safety * 0.22
      + ticket.satisfaction
      + getResearchEffect('satisfactionFlat')
      + (region.ops.groomingBoostHours > 0 ? 5 : 0)
      + Math.min(15, region.snow / 8)
      - Math.max(0, waitPressure - 0.9) * 60
      - accidents * 2.3,
    10,
    99
  );

  const familySpend = ticket.price + 10 + spendBase * 0.75 + comfort * 0.12;
  const sportSpend = ticket.price + 14 + spendBase * 0.92 + (getResearchEffect('sportSpend') || 0);
  const luxurySpend = ticket.price + 28 + spendBase * 1.25 + luxury * 1.2 + comfort * 0.38;
  const budgetSpend = ticket.price + 6 + spendBase * 0.55;
  const hotelRevenue = sumRegionStat(region, 'hotelCap') * (0.42 + luxury * 0.006) * 48;

  const revenue = familyGuests * familySpend + sportGuests * sportSpend + luxuryGuests * luxurySpend + budgetGuests * budgetSpend + hotelRevenue;
  const powerUse = sumRegionStat(region, 'power');
  const waterUse = sumRegionStat(region, 'water');
  const upkeep = sumRegionStat(region, 'upkeep')
    + sumSlopeStat(region, 'grooming') * (1 + getResearchEffect('groomingCostMult'))
    + powerUse * 21
    + waterUse * 12;
  const ecoDiscount = Math.max(-0.25, -(eco * 0.01) + getResearchEffect('costMult'));
  const maintenanceDiscount = Math.max(-0.18, -maintenance * 0.004);
  const costs = upkeep * (1 + ecoDiscount + maintenanceDiscount + getActiveEffect('costMult'));

  return {
    liftCap: Math.round(liftCap),
    slopeCap: Math.round(slopeCap),
    serviceCap: Math.round(serviceCap),
    capacity,
    guests,
    accidents,
    safety: Math.round(safety),
    comfort: Math.round(comfort),
    satisfaction: Math.round(satisfaction),
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    profit: Math.round(revenue - costs),
    snowSupport,
    rawAppeal: Math.round(def.appeal + comfort + luxury + familyAppeal + expertAppeal),
    waitPressure,
    segments: {
      family: familyGuests,
      sport: sportGuests,
      luxury: luxuryGuests,
      budget: budgetGuests
    }
  };
}

function nextWeatherKey() {
  const roll = Math.random();
  const lateSeason = state.seasonDay > 92;
  if (roll < 0.18) return 'snowfall';
  if (roll < 0.37) return 'bluebird';
  if (roll < 0.60) return 'cloudy';
  if (roll < 0.77) return 'windy';
  if (roll < (lateSeason ? 0.95 : 0.9)) return 'warm';
  return 'storm';
}

function tickEvents(hours) {
  state.activeEvents = state.activeEvents
    .map(event => ({ ...event, hoursLeft: event.hoursLeft - hours }))
    .filter(event => event.hoursLeft > 0);
}

function triggerRandomEvent() {
  const event = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  state.activeEvents.push({
    id: `${event.id}_${Date.now()}`,
    title: event.title,
    desc: event.desc,
    effects: { ...event.effects },
    hoursLeft: event.durationDays * 24
  });
  addNews(`Event: ${event.title} – ${event.desc}`, 'event');
}

function maybeSellSeasonPasses() {
  const base = Math.max(0, Math.round((state.reputation / 10) + getUnlockedRegions().length * 4 + state.training.marketing));
  if (base <= 0) return 0;
  state.seasonPasses += base;
  return base;
}

function seasonWrapUp() {
  const summary = getSummary();
  const awardCount = getUnlockedAwards().length;
  const bonus = Math.round(summary.avgSatisfaction * 120 + state.reputation * 45 + awardCount * 3500);
  state.money += bonus;
  addNews(`Saison ${state.seasonYear} abgeschlossen: Saisonbonus ${formatMoney(bonus)} für Zufriedenheit, Reputation und Awards.`, 'success');
  state.seasonYear += 1;
  state.seasonDay = 1;
}

function simulateDay() {
  state.weatherKey = nextWeatherKey();
  const weather = getWeatherDef();
  let dailyGuests = 0;
  let dailyProfit = 0;
  let dailyAccidents = 0;
  const wages = state.staff * (30 + state.training.service * 1.5 + state.training.safety * 1.5 + state.training.marketing * 1.2);
  const debtInterest = state.debt > 0 ? Math.round(state.debt * 0.0028) : 0;

  getUnlockedRegions().forEach(region => {
    region.snow = clamp(region.snow + weather.snow + getResearchEffect('snowRetention') + (region.ops.groomingBoostHours > 0 ? 2 : 0), 8, 140);
    const metrics = getRegionMetrics(region);
    region.guestsToday = metrics.guests;
    region.lastRevenue = metrics.revenue;
    region.lastCosts = metrics.costs;
    region.lastProfit = metrics.profit;
    region.lastAccidents = metrics.accidents;
    region.lastSegments = metrics.segments;
    region.satisfaction = metrics.satisfaction;
    dailyGuests += metrics.guests;
    dailyProfit += metrics.profit;
    dailyAccidents += metrics.accidents;
    region.ops.groomingBoostHours = Math.max(0, region.ops.groomingBoostHours - 24);
    region.ops.safetyBoostHours = Math.max(0, region.ops.safetyBoostHours - 24);
    region.ops.campaignBoostHours = Math.max(0, region.ops.campaignBoostHours - 24);
    region.ops.festivalBoostHours = Math.max(0, region.ops.festivalBoostHours - 24);
  });

  dailyProfit -= wages;
  dailyProfit -= debtInterest;
  state.money = Math.max(-100000, state.money + dailyProfit);
  state.reputation = clamp(
    state.reputation
      + dailyGuests * 0.008
      + getResearchEffect('repDaily')
      + getActiveEffect('repDaily')
      + (dailyAccidents === 0 ? 0.9 : 0)
      - dailyAccidents * 0.28
      + (dailyProfit > 0 ? 0.25 : -0.12),
    0,
    9999
  );

  if (state.day % 7 === 0) {
    const sold = maybeSellSeasonPasses();
    if (sold > 0) {
      const revenue = sold * 140;
      state.money += revenue;
      addNews(`Saisonpass-Aktion: ${sold} neue Pässe verkauft (${formatMoney(revenue)}).`, 'success');
    }
  }

  if (state.day % 4 === 0 && Math.random() < 0.6) triggerRandomEvent();
  tickEvents(24);

  if (dailyGuests > 0) addNews(`Tag ${state.day}: ${dailyGuests} Gäste, ${formatMoney(dailyProfit)} Tagesergebnis, Wetter: ${weather.label}.`, dailyProfit >= 0 ? 'success' : 'warn');
  if (dailyAccidents >= 7) addNews(`Warnung: ${dailyAccidents} Unfälle an einem Tag. Mehr Safety lohnt sich jetzt wirklich.`, 'warn');
  if (state.money < 0) addNews('Deine Resort-Gruppe ist im Minus. Marketing und Bauen solltest du kurz bremsen.', 'warn');
  if (state.seasonDay >= 120) seasonWrapUp();
}

function simHour(count = 1) {
  for (let i = 0; i < count; i += 1) {
    progressQueues(1);
    state.hour += 1;
    if (state.hour >= 24) {
      state.hour = 0;
      state.day += 1;
      state.seasonDay += 1;
      simulateDay();
    }
  }
}

function addNews(text, type = 'info') {
  state.news.unshift({ day: state.day, text, type });
  state.news = state.news.slice(0, 90);
}

function buyResearch(id) {
  const item = RESEARCH[id];
  if (!item || state.research[id] || state.money < item.cost) return;
  state.money -= item.cost;
  state.research[id] = true;
  addNews(`Forschung abgeschlossen: ${item.name}.`, 'success');
}

function claimGoal(id) {
  const goal = GOALS.find(item => item.id === id);
  if (!goal || state.goalsClaimed[id] || !goal.check(state)) return;
  state.money += goal.rewardMoney || 0;
  state.reputation += goal.rewardRep || 0;
  state.goalsClaimed[id] = true;
  addNews(`Ziel abgeschlossen: ${goal.label}. Belohnung: ${formatMoney(goal.rewardMoney || 0)} und ${goal.rewardRep || 0} Reputation.`, 'success');
}

function hireStaff() {
  const price = 1200 + state.staff * 150;
  if (state.money < price) return;
  state.money -= price;
  state.staff += 1;
  addNews(`Neues Personal eingestellt. Gesamtpersonal: ${state.staff}.`, 'success');
}

function fireStaff() {
  if (state.staff <= 6) return;
  state.staff -= 1;
  addNews(`Ein Mitarbeiter wurde abgebaut. Gesamtpersonal: ${state.staff}.`, 'warn');
}

function trainStaff(kind) {
  const costs = {
    service: 9000 + state.training.service * 5000,
    safety: 11000 + state.training.safety * 6000,
    ops: 12000 + state.training.ops * 6500,
    marketing: 10000 + state.training.marketing * 5500
  };
  const price = costs[kind];
  if (price == null || state.money < price) return;
  state.money -= price;
  state.training[kind] += 1;
  addNews(`Training verbessert: ${kind}. Neues Level ${state.training[kind]}.`, 'success');
}

function startMarketing() {
  const cost = 9000 + getUnlockedRegions().length * 1800;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.campaignBoostHours = Math.max(region.ops.campaignBoostHours, 72); });
  addNews('Marketingkampagne gestartet. Nachfrage steigt für drei Tage.', 'event');
}

function groomAll() {
  const cost = 5000 + getUnlockedRegions().length * 1400;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.groomingBoostHours = Math.max(region.ops.groomingBoostHours, 48); });
  addNews('Alle Pisten frisch präpariert. Zufriedenheit steigt kurzfristig.', 'success');
}

function safetyInspection() {
  const cost = 4500 + getUnlockedRegions().length * 600;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.safetyBoostHours = Math.max(region.ops.safetyBoostHours, 72); });
  addNews('Sicherheitsinspektion durchgeführt. Risiko sinkt für drei Tage.', 'success');
}

function launchFestival() {
  const cost = 14000 + totalStructure(state, 'event_arena') * 2000;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.festivalBoostHours = Math.max(region.ops.festivalBoostHours, 48); });
  addNews('Festival-Wochenende läuft. Nachfrage und Sichtbarkeit steigen.', 'event');
}

function emergencySnow() {
  const cost = 12000 + getUnlockedRegions().length * 2500;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.snow = clamp(region.snow + 18, 8, 140); });
  addNews('Notbeschneiung aktiviert. Alle Regionen gewinnen Schneereserven.', 'success');
}

function takeLoan() {
  state.money += 60000;
  state.debt += 72000;
  addNews('Betriebskredit aufgenommen: +60.000 € sofort, Rückzahlung über Zeit.', 'warn');
}

function repayLoan() {
  if (state.debt <= 0) return;
  const amount = Math.min(state.debt, 60000, state.money);
  if (amount <= 0) return;
  state.money -= amount;
  state.debt -= amount;
  addNews(`Kredit zurückgezahlt: ${formatMoney(amount)}. Restschuld: ${formatMoney(state.debt)}.`, 'success');
}

function unlockRegion(id) {
  const region = state.regions[id];
  const def = REGION_DEFS[id];
  if (!region || region.unlocked || state.money < def.unlockCost) return;
  state.money -= def.unlockCost;
  region.unlocked = true;
  region.snow = def.snowBase;
  region.assets.parking = 1;
  region.assets.draglift = 1;
  region.assets.cafe = 1;
  region.slopes.blue = 1;
  addNews(`Neues Gebiet erschlossen: ${def.name}.`, 'success');
}

function doPrestige() {
  if (state.reputation < 250 || state.money < 500000) return;
  const nextPrestige = state.prestige + 1;
  state = createInitialState();
  state.prestige = nextPrestige;
  state.money = 60000 + nextPrestige * 15000;
  state.reputation = 24 + nextPrestige * 8;
  addNews(`Neue Resort-Gruppe gegründet. Prestige ${state.prestige} aktiv.`, 'success');
}

function saveGame() {
  state.lastTimestamp = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyOfflineProgress() {
  const now = Date.now();
  const last = state.lastTimestamp || now;
  const diffHours = Math.min(OFFLINE_CAP_HOURS, Math.floor((now - last) / (1000 * 60 * 60)));
  if (diffHours > 0) {
    simHour(diffHours);
    addNews(`Offline-Fortschritt: ${formatHours(diffHours)} nachsimuliert.`, 'success');
  }
  state.lastTimestamp = now;
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== SAVE_VERSION) return false;
    state = parsed;
    applyOfflineProgress();
    return true;
  } catch {
    return false;
  }
}

function exportSave() {
  saveGame();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(encoded).then(() => addNews('Save-Code in die Zwischenablage kopiert.', 'success'));
  } else {
    prompt('Speichercode kopieren:', encoded);
  }
}

function importSave() {
  const raw = prompt('Füge hier deinen Save-Code ein:');
  if (!raw) return;
  try {
    const decoded = decodeURIComponent(escape(atob(raw)));
    const parsed = JSON.parse(decoded);
    if (parsed.version !== SAVE_VERSION) throw new Error('Version mismatch');
    state = parsed;
    state.lastTimestamp = Date.now();
    saveGame();
    addNews('Save erfolgreich importiert.', 'success');
  } catch {
    alert('Import fehlgeschlagen.');
  }
}

function resetGame() {
  if (!confirm('Wirklich alles zurücksetzen?')) return;
  state = createInitialState();
  saveGame();
}

function getSummary() {
  const unlocked = getUnlockedRegions();
  const guests = unlocked.reduce((sum, region) => sum + region.guestsToday, 0);
  const profit = unlocked.reduce((sum, region) => sum + region.lastProfit, 0) - state.staff * 30 - (state.debt > 0 ? Math.round(state.debt * 0.0028) : 0);
  const avgSatisfaction = unlocked.length ? unlocked.reduce((sum, region) => sum + region.satisfaction, 0) / unlocked.length : 0;
  const segments = unlocked.reduce((sum, region) => {
    sum.family += region.lastSegments.family || 0;
    sum.sport += region.lastSegments.sport || 0;
    sum.luxury += region.lastSegments.luxury || 0;
    sum.budget += region.lastSegments.budget || 0;
    return sum;
  }, { family: 0, sport: 0, luxury: 0, budget: 0 });
  return {
    guests,
    profit,
    avgSatisfaction,
    staffNeed: getGlobalStaffNeed(),
    weather: getWeatherDef(),
    segments,
    awards: getUnlockedAwards().length
  };
}

function getUnlockedAwards() {
  return AWARDS.filter(item => item.check(state));
}

function ticketModeLabel(mode) {
  if (mode === 'value') return 'Günstig';
  if (mode === 'premium') return 'Premium';
  return 'Standard';
}

function renderStats() {
  const summary = getSummary();
  const stats = [
    { label: 'Geld', value: formatMoney(state.money), sub: `Schuld ${formatMoney(state.debt)}` },
    { label: 'Reputation', value: formatInt(state.reputation), sub: `Prestige ${state.prestige}` },
    { label: 'Tag / Uhrzeit', value: `Tag ${state.day}`, sub: `${String(state.hour).padStart(2, '0')}:00 Uhr · Saison ${state.seasonYear}` },
    { label: 'Wetter', value: summary.weather.label, sub: summary.weather.note },
    { label: 'Gäste heute', value: formatInt(summary.guests), sub: `${formatInt(summary.segments.family)} Familien · ${formatInt(summary.segments.sport)} Sport` },
    { label: 'Tagesergebnis', value: formatMoney(summary.profit), sub: summary.profit >= 0 ? 'Operativ im Plus' : 'Operativ im Minus' },
    { label: 'Personal', value: `${state.staff} / ${summary.staffNeed}`, sub: summary.staffNeed > state.staff ? 'Zu wenig Personal' : 'Besetzung stabil' },
    { label: 'Ø Zufriedenheit', value: `${formatInt(summary.avgSatisfaction)}%`, sub: `${summary.awards} Awards · ${state.seasonPasses} Saisonpässe` }
  ];
  document.getElementById('stats-grid').innerHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-label">${stat.label}</div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-sub">${stat.sub}</div>
    </div>
  `).join('');
  document.getElementById('headline-status').textContent = `${getUnlockedRegions().length} aktive Gebiete · ${Object.keys(state.research).filter(k => state.research[k]).length} Forschungen · Ticketmodus: ${ticketModeLabel(state.ticketMode)} · Saisonpässe: ${state.seasonPasses}`;
}

function renderGoal(goal) {
  const done = goal.check(state);
  const claimed = !!state.goalsClaimed[goal.id];
  return `
    <div class="objective">
      <div class="news-meta">
        <strong>${goal.label}</strong>
        <span class="tag ${claimed ? 'good' : done ? 'warn' : ''}">${claimed ? 'Belohnt' : done ? 'Abholbar' : 'Offen'}</span>
      </div>
      <p class="muted small">Belohnung: ${formatMoney(goal.rewardMoney || 0)} · ${goal.rewardRep || 0} Reputation</p>
      <div class="inline-actions" style="margin-top:10px;">
        <button class="primary-btn" data-action="claim-goal" data-id="${goal.id}" ${!done || claimed ? 'disabled' : ''}>Belohnung holen</button>
      </div>
    </div>
  `;
}

function renderOverview() {
  const awards = getUnlockedAwards();
  const summary = getSummary();
  const goals = GOALS.map(renderGoal).join('');
  const regionCards = getUnlockedRegions().map(region => {
    const metrics = getRegionMetrics(region);
    return `
      <div class="region-card">
        <div class="region-title">
          <div>
            <h3>${REGION_DEFS[region.id].name}</h3>
            <p class="muted small">${REGION_DEFS[region.id].specialty}</p>
          </div>
          <span class="tag ${region.lastProfit >= 0 ? 'good' : region.lastProfit < -2000 ? 'bad' : 'warn'}">${formatMoney(region.lastProfit)}</span>
        </div>
        <div class="detail-list">
          <div class="detail-item"><span>Gäste</span><strong>${formatInt(region.guestsToday)}</strong></div>
          <div class="detail-item"><span>Schnee</span><strong>${formatInt(region.snow)} cm</strong></div>
          <div class="detail-item"><span>Zufriedenheit</span><strong>${region.satisfaction}%</strong></div>
          <div class="detail-item"><span>Kapazität</span><strong>${formatInt(metrics.capacity)}</strong></div>
          <div class="detail-item"><span>Sicherheit</span><strong>${formatInt(metrics.safety)}</strong></div>
          <div class="detail-item"><span>Segmente</span><strong>${formatInt(region.lastSegments.family)}F · ${formatInt(region.lastSegments.sport)}S · ${formatInt(region.lastSegments.luxury)}L</strong></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="hero-panel">
      <p class="eyebrow">SkiTycoon V3</p>
      <h2>Baue nicht nur ein Skigebiet – baue eine Marke</h2>
      <p>Jetzt mit Gästesegmenten, Zielen, Awards, Krediten, Saisonpässen, mehr Lift- und Pistensorten, mehr Forschung, Festivals, Training und deutlich mehr Resort-Tiefe.</p>
      <div class="inline-actions" style="margin-top:16px;">
        <button class="primary-btn" data-action="tab" data-tab="build">Jetzt bauen</button>
        <button class="secondary-btn" data-action="festival">Festival starten</button>
        <button class="ghost-btn" data-action="ticket" data-mode="premium">Auf Premium setzen</button>
      </div>
    </section>

    <div class="overview-grid" style="margin-top:14px;">
      <div class="card">
        <div class="card-title"><h3>Ziele</h3><span class="tag">${GOALS.filter(g => g.check(state)).length}/${GOALS.length}</span></div>
        <div class="objective-list">${goals}</div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Awards & Events</h3><span class="tag">${awards.length}</span></div>
        <div class="banner-list">
          ${awards.length ? awards.map(a => `<div class="event-banner"><div class="event-meta"><strong>${a.label}</strong><span class="tag good">Award</span></div><p class="muted small">Dauerhaft freigeschaltet durch deinen aktuellen Resort-Stand.</p></div>`).join('') : '<div class="event-banner"><div class="event-meta"><strong>Noch keine Awards</strong><span class="tag">0</span></div><p class="muted small">Baue weiter aus, um erste Resort-Auszeichnungen zu erhalten.</p></div>'}
          ${renderActiveEventsCompact()}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-title"><h3>Gästemix heute</h3><span class="tag">${formatInt(summary.guests)} gesamt</span></div>
      <div class="detail-list">
        <div class="detail-item"><span>Familien</span><strong>${formatInt(summary.segments.family)}</strong></div>
        <div class="detail-item"><span>Sportfahrer</span><strong>${formatInt(summary.segments.sport)}</strong></div>
        <div class="detail-item"><span>Luxusgäste</span><strong>${formatInt(summary.segments.luxury)}</strong></div>
        <div class="detail-item"><span>Budgetgäste</span><strong>${formatInt(summary.segments.budget)}</strong></div>
      </div>
    </div>

    <div class="region-grid" style="margin-top:14px;">${regionCards}</div>
  `;
}

function renderActiveEventsCompact() {
  if (!state.activeEvents.length) {
    return '<div class="event-banner"><div class="event-meta"><span>Keine aktiven Events</span><span class="tag">ruhig</span></div><p class="muted small">Gerade läuft kein globales Sonderereignis.</p></div>';
  }
  return state.activeEvents.map(event => `
    <div class="event-banner">
      <div class="event-meta"><strong>${event.title}</strong><span class="tag">${formatHours(event.hoursLeft)}</span></div>
      <p class="muted small">${event.desc}</p>
    </div>
  `).join('');
}

function renderBuildCard(region, kind, item) {
  const current = kind === 'structure' ? region.assets[item.id] : region.slopes[item.id];
  const available = isAvailableInRegion(region.id, kind, item.id);
  const affordable = state.money >= item.cost;
  const disabled = !available || !affordable;
  const badges = [];
  ['liftCap', 'serviceCap', 'hotelCap', 'slopeCap', 'comfort', 'safety', 'snowSupport', 'luxury', 'familyAppeal', 'sportAppeal'].forEach(key => {
    if (item[key]) badges.push(`${key.replace(/[A-Z]/g, c => ' ' + c.toLowerCase())} ${item[key]}`);
  });
  return `
    <div class="build-card">
      <div class="build-title">
        <div>
          <h4>${item.icon} ${item.name}</h4>
          <p class="muted small">${item.desc}</p>
        </div>
        <span class="tag">Lvl ${current}</span>
      </div>
      <div class="detail-list">
        <div class="detail-item"><span>Kosten</span><strong>${formatMoney(item.cost)}</strong></div>
        <div class="detail-item"><span>Bauzeit</span><strong>${formatHours(Math.max(2, Math.round(item.buildHours / getBuildSpeedMult())))}</strong></div>
        <div class="detail-item"><span>Effekte</span><strong>${badges.join(' · ') || 'Spezialeffekt'}</strong></div>
      </div>
      <div class="inline-actions" style="margin-top:12px;">
        <button class="build-btn" data-action="build" data-kind="${kind}" data-id="${item.id}" ${disabled ? 'disabled' : ''}>Bauen</button>
        ${!available ? '<span class="tag bad">Anforderung fehlt</span>' : ''}
      </div>
    </div>
  `;
}

function renderBuild() {
  const region = state.regions[state.ui.region] || getUnlockedRegions()[0];
  const metrics = getRegionMetrics(region);
  const structures = Object.values(STRUCTURES).map(item => renderBuildCard(region, 'structure', item)).join('');
  const slopes = Object.values(SLOPES).map(item => renderBuildCard(region, 'slope', item)).join('');
  const queue = region.queue.length ? region.queue.map(item => `
    <div class="queue-item">
      <div class="news-meta"><strong>${item.name}</strong><span class="tag">${formatHours(item.hoursLeft)}</span></div>
      <div class="meter"><div class="meter-fill" style="width:${100 - (item.hoursLeft / item.totalHours) * 100}%"></div></div>
    </div>
  `).join('') : '<div class="queue-item"><p class="muted">Keine laufenden Bauprojekte.</p></div>';

  return `
    <div class="toolbar">
      ${getUnlockedRegions().map(r => `<button class="chip-btn ${state.ui.region === r.id ? 'active' : ''}" data-action="select-region" data-region="${r.id}">${REGION_DEFS[r.id].name}</button>`).join('')}
    </div>

    <div class="overview-grid" style="margin-top:14px;">
      <div class="card">
        <div class="card-title"><h3>${REGION_DEFS[region.id].name}</h3><span class="tag">${REGION_DEFS[region.id].specialty}</span></div>
        <div class="detail-list">
          <div class="detail-item"><span>Liftkapazität</span><strong>${formatInt(metrics.liftCap)}</strong></div>
          <div class="detail-item"><span>Pistenkapazität</span><strong>${formatInt(metrics.slopeCap)}</strong></div>
          <div class="detail-item"><span>Servicekapazität</span><strong>${formatInt(metrics.serviceCap)}</strong></div>
          <div class="detail-item"><span>Appeal</span><strong>${formatInt(metrics.rawAppeal)}</strong></div>
          <div class="detail-item"><span>Schnee-Support</span><strong>${formatInt(metrics.snowSupport)}</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Bauqueue</h3><span class="tag">${region.queue.length}</span></div>
        <div class="queue-list">${queue}</div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-title"><h3>Lifte & Infrastruktur</h3><span class="tag">${Object.values(region.assets).reduce((a, b) => a + b, 0)} gebaut</span></div>
      <div class="build-grid">${structures}</div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-title"><h3>Pisten</h3><span class="tag">${Object.values(region.slopes).reduce((a, b) => a + b, 0)} angelegt</span></div>
      <div class="build-grid">${slopes}</div>
    </div>
  `;
}

function renderResearch() {
  const cards = Object.values(RESEARCH).map(item => {
    const owned = !!state.research[item.id];
    return `
      <div class="research-card">
        <div class="research-title">
          <div>
            <h3>${item.name}</h3>
            <p class="muted small">${item.desc}</p>
          </div>
          <span class="tag ${owned ? 'good' : ''}">${owned ? 'Erforscht' : 'Offen'}</span>
        </div>
        <div class="detail-item"><span>Kosten</span><strong>${formatMoney(item.cost)}</strong></div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="primary-btn" data-action="research" data-id="${item.id}" ${owned || state.money < item.cost ? 'disabled' : ''}>Erforschen</button>
        </div>
      </div>
    `;
  }).join('');
  return `
    <section class="hero-panel">
      <p class="eyebrow">Forschung</p>
      <h2>Technik, Hospitality, Racing, Nachhaltigkeit</h2>
      <p>Das Tech-Grid ist jetzt deutlich größer und schaltet nicht nur Zahlenboni, sondern echte Bauoptionen und Resort-Richtungen frei.</p>
    </section>
    <div class="research-grid" style="margin-top:14px;">${cards}</div>
  `;
}

function renderOperations() {
  const summary = getSummary();
  return `
    <div class="operations-grid">
      <div class="card">
        <div class="card-title"><h3>Betriebshebel</h3><span class="tag">Live</span></div>
        <div class="inline-actions">
          <button class="primary-btn" data-action="hire-staff">Personal einstellen</button>
          <button class="ghost-btn" data-action="fire-staff" ${state.staff <= 6 ? 'disabled' : ''}>Personal abbauen</button>
          <button class="secondary-btn" data-action="marketing" ${state.money < 9000 ? 'disabled' : ''}>Marketingkampagne</button>
          <button class="secondary-btn" data-action="groom" ${state.money < 5000 ? 'disabled' : ''}>Alle Pisten präparieren</button>
          <button class="ghost-btn" data-action="inspect" ${state.money < 4500 ? 'disabled' : ''}>Sicherheitsinspektion</button>
          <button class="ghost-btn" data-action="festival" ${state.money < 14000 ? 'disabled' : ''}>Festival starten</button>
          <button class="ghost-btn" data-action="snow" ${state.money < 12000 ? 'disabled' : ''}>Notbeschneiung</button>
          <button class="ghost-btn" data-action="loan">Kredit aufnehmen</button>
          <button class="ghost-btn" data-action="repay" ${state.debt <= 0 || state.money <= 0 ? 'disabled' : ''}>Kredit tilgen</button>
        </div>
        <div class="detail-list" style="margin-top:14px;">
          <div class="detail-item"><span>Personal</span><strong>${state.staff}</strong></div>
          <div class="detail-item"><span>Benötigt</span><strong>${summary.staffNeed}</strong></div>
          <div class="detail-item"><span>Saisonpässe</span><strong>${state.seasonPasses}</strong></div>
          <div class="detail-item"><span>Schulden</span><strong>${formatMoney(state.debt)}</strong></div>
        </div>
        <div class="segmented" style="margin-top:14px;">
          <button class="chip-btn ${state.ticketMode === 'value' ? 'active' : ''}" data-action="ticket" data-mode="value">Günstig</button>
          <button class="chip-btn ${state.ticketMode === 'standard' ? 'active' : ''}" data-action="ticket" data-mode="standard">Standard</button>
          <button class="chip-btn ${state.ticketMode === 'premium' ? 'active' : ''}" data-action="ticket" data-mode="premium">Premium</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Training</h3><span class="tag">Teams</span></div>
        <div class="detail-list">
          <div class="detail-item"><span>Service</span><strong>Lvl ${state.training.service}</strong></div>
          <div class="detail-item"><span>Safety</span><strong>Lvl ${state.training.safety}</strong></div>
          <div class="detail-item"><span>Ops</span><strong>Lvl ${state.training.ops}</strong></div>
          <div class="detail-item"><span>Marketing</span><strong>Lvl ${state.training.marketing}</strong></div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="primary-btn" data-action="train" data-kind="service">Service trainieren</button>
          <button class="primary-btn" data-action="train" data-kind="safety">Safety trainieren</button>
          <button class="primary-btn" data-action="train" data-kind="ops">Ops trainieren</button>
          <button class="primary-btn" data-action="train" data-kind="marketing">Marketing trainieren</button>
        </div>
      </div>
    </div>
  `;
}

function renderRegions() {
  const cards = Object.values(REGION_DEFS).map(def => {
    const region = state.regions[def.id];
    return `
      <div class="region-card">
        <div class="region-title">
          <div>
            <h3>${def.name}</h3>
            <p class="muted small">${def.specialty}</p>
          </div>
          <span class="tag ${region.unlocked ? 'good' : ''}">${region.unlocked ? 'Offen' : 'Gesperrt'}</span>
        </div>
        <p class="muted small">${def.description}</p>
        <div class="detail-list" style="margin-top:12px;">
          <div class="detail-item"><span>Höhe</span><strong>${def.altitude} m</strong></div>
          <div class="detail-item"><span>Schnee-Basis</span><strong>${def.snowBase} cm</strong></div>
          <div class="detail-item"><span>Freischaltkosten</span><strong>${formatMoney(def.unlockCost)}</strong></div>
          ${region.unlocked ? `<div class="detail-item"><span>Aktuelle Gäste</span><strong>${formatInt(region.guestsToday)}</strong></div>` : ''}
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="primary-btn" data-action="unlock-region" data-id="${def.id}" ${region.unlocked || state.money < def.unlockCost ? 'disabled' : ''}>Freischalten</button>
          ${region.unlocked ? `<button class="ghost-btn" data-action="select-region" data-region="${def.id}">Ansehen</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  return `
    <section class="hero-panel">
      <p class="eyebrow">Expansion</p>
      <h2>Jeder Berg spielt sich anders</h2>
      <p>Familienberge, Sportberge, Rennzentren und Luxus-Gletscher geben dir jetzt echte Entscheidungen für dein Mid- und Endgame.</p>
    </section>
    <div class="region-grid" style="margin-top:14px;">${cards}</div>
  `;
}

function renderEvents() {
  const awards = getUnlockedAwards();
  const news = state.news.map(entry => `
    <div class="news-item">
      <div class="news-meta"><span>Tag ${entry.day}</span><span class="tag ${entry.type === 'success' ? 'good' : entry.type === 'warn' ? 'warn' : ''}">${entry.type}</span></div>
      <p>${entry.text}</p>
    </div>
  `).join('');
  return `
    <div class="events-grid">
      <div class="card">
        <div class="card-title"><h3>Aktive Events & Awards</h3><span class="tag">${state.activeEvents.length + awards.length}</span></div>
        <div class="banner-list">
          ${renderActiveEventsCompact()}
          ${awards.map(a => `<div class="event-banner"><div class="event-meta"><strong>${a.label}</strong><span class="tag good">Award</span></div><p class="muted small">Dieser Status ist aktuell aktiv.</p></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Newsfeed</h3><span class="tag">${state.news.length}</span></div>
        <div class="news-list">${news}</div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="settings-grid">
      <div class="card">
        <div class="card-title"><h3>Save & Reset</h3><span class="tag">lokal</span></div>
        <div class="inline-actions">
          <button class="primary-btn" data-action="save">Speichern</button>
          <button class="secondary-btn" data-action="export">Export</button>
          <button class="ghost-btn" data-action="import">Import</button>
          <button class="ghost-btn" data-action="reset">Neustart</button>
        </div>
        <p class="muted small" style="margin-top:14px;">Wegen der vielen neuen Systeme verwendet diese Version ein neues Save-Format. Alte V2-Saves werden absichtlich nicht weiterverwendet.</p>
      </div>
      <div class="card">
        <div class="card-title"><h3>Prestige</h3><span class="tag">Meta</span></div>
        <div class="detail-list">
          <div class="detail-item"><span>Aktuelles Prestige</span><strong>${state.prestige}</strong></div>
          <div class="detail-item"><span>Nächste Voraussetzung</span><strong>250 Rep & 500.000 €</strong></div>
          <div class="detail-item"><span>Bonus pro Prestige</span><strong>+5% Baugeschwindigkeit, bessere Starts</strong></div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="primary-btn" data-action="prestige" ${state.reputation < 250 || state.money < 500000 ? 'disabled' : ''}>Neue Resort-Gruppe gründen</button>
        </div>
      </div>
    </div>
  `;
}

function renderView() {
  const view = document.getElementById('view');
  const tab = state.ui.tab;
  if (tab === 'build') view.innerHTML = renderBuild();
  else if (tab === 'research') view.innerHTML = renderResearch();
  else if (tab === 'operations') view.innerHTML = renderOperations();
  else if (tab === 'regions') view.innerHTML = renderRegions();
  else if (tab === 'events') view.innerHTML = renderEvents();
  else if (tab === 'settings') view.innerHTML = renderSettings();
  else view.innerHTML = renderOverview();
}

function renderTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === state.ui.tab);
  });
}

function render() {
  renderStats();
  renderTabs();
  renderView();
  saveGame();
}

function handleAction(action, button) {
  if (action === 'tab') state.ui.tab = button.dataset.tab;
  if (action === 'select-region') { state.ui.region = button.dataset.region; state.ui.tab = 'build'; }
  if (action === 'build') queueProject(state.ui.region, button.dataset.kind, button.dataset.id);
  if (action === 'research') buyResearch(button.dataset.id);
  if (action === 'hire-staff') hireStaff();
  if (action === 'fire-staff') fireStaff();
  if (action === 'marketing') startMarketing();
  if (action === 'groom') groomAll();
  if (action === 'inspect') safetyInspection();
  if (action === 'festival') launchFestival();
  if (action === 'snow') emergencySnow();
  if (action === 'loan') takeLoan();
  if (action === 'repay') repayLoan();
  if (action === 'unlock-region') unlockRegion(button.dataset.id);
  if (action === 'ticket') state.ticketMode = button.dataset.mode;
  if (action === 'speed') state.speed = Number(button.dataset.speed || 1);
  if (action === 'train') trainStaff(button.dataset.kind);
  if (action === 'claim-goal') claimGoal(button.dataset.id);
  if (action === 'save') saveGame();
  if (action === 'export') exportSave();
  if (action === 'import') importSave();
  if (action === 'reset') resetGame();
  if (action === 'prestige') doPrestige();
  render();
}

function startLoop() {
  if (loopHandle) clearInterval(loopHandle);
  loopHandle = setInterval(() => {
    simHour(state.speed * HOURS_PER_TICK);
    render();
  }, TICK_MS);
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  handleAction(button.dataset.action, button);
});

document.addEventListener('DOMContentLoaded', () => {
  loadGame();
  render();
  startLoop();
});
