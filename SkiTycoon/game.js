const STORAGE_KEY = 'skitycoon_v2_main';
const SAVE_VERSION = 2;
const TICK_MS = 1000;
const HOURS_PER_TICK = 1;
const OFFLINE_CAP_HOURS = 8 * 24;

const REGION_DEFS = {
  alpine_meadow: {
    id: 'alpine_meadow',
    name: 'Almwiese',
    description: 'Dein Startgebiet: günstig, freundlich, aber nicht besonders schneesicher.',
    unlockCost: 0,
    baseDemand: 22,
    appeal: 4,
    altitude: 1250,
    familyBias: 1.18,
    expertBias: 0.82,
    snowBase: 55,
    specialty: 'Familiengebiet'
  },
  adlerhorn: {
    id: 'adlerhorn',
    name: 'Adlerhorn',
    description: 'Steiler, windiger Sportberg mit starkem Ruf bei ambitionierten Fahrern.',
    unlockCost: 90000,
    baseDemand: 34,
    appeal: 10,
    altitude: 2100,
    familyBias: 0.88,
    expertBias: 1.26,
    snowBase: 78,
    specialty: 'Sport & Freeride'
  },
  waldtal: {
    id: 'waldtal',
    name: 'Waldtal',
    description: 'Geschütztes Waldgebiet mit vielen blauen Pisten und starker Sommeroption.',
    unlockCost: 175000,
    baseDemand: 40,
    appeal: 14,
    altitude: 1650,
    familyBias: 1.25,
    expertBias: 0.92,
    snowBase: 64,
    specialty: 'Familie & Komfort'
  },
  gletscherkrone: {
    id: 'gletscherkrone',
    name: 'Gletscherkrone',
    description: 'High-End-Gebiet mit Schnee-Garantie, Luxusgästen und enormen Baukosten.',
    unlockCost: 360000,
    baseDemand: 56,
    appeal: 22,
    altitude: 2950,
    familyBias: 0.96,
    expertBias: 1.18,
    snowBase: 92,
    specialty: 'Luxus & Schneesicherheit'
  }
};

const STRUCTURES = {
  conveyor: {
    id: 'conveyor',
    category: 'lift',
    name: 'Förderband',
    icon: '🟦',
    desc: 'Perfekt für Anfängerflächen und Skischulen.',
    cost: 4000,
    buildHours: 8,
    liftCap: 24,
    upkeep: 55,
    prestige: 1,
    staff: 1,
    power: 1
  },
  draglift: {
    id: 'draglift',
    category: 'lift',
    name: 'Schlepplift',
    icon: '⛓️',
    desc: 'Der günstige Standardlift für den frühen Ausbau.',
    cost: 9000,
    buildHours: 14,
    liftCap: 56,
    upkeep: 120,
    prestige: 3,
    staff: 2,
    power: 2
  },
  chairlift: {
    id: 'chairlift',
    category: 'lift',
    name: '4er-Sessellift',
    icon: '🪑',
    desc: 'Solide Kapazität und hoher Komfort.',
    cost: 24000,
    buildHours: 28,
    liftCap: 120,
    upkeep: 260,
    prestige: 7,
    staff: 4,
    power: 5
  },
  gondola: {
    id: 'gondola',
    category: 'lift',
    name: 'Gondelbahn',
    icon: '🚠',
    desc: 'Der Prestige-Lift für große Massen und kalte Tage.',
    cost: 78000,
    buildHours: 54,
    liftCap: 280,
    upkeep: 720,
    prestige: 18,
    staff: 8,
    power: 12,
    requires: { research: 'express_lifts' }
  },
  parking: {
    id: 'parking',
    category: 'facility',
    name: 'Parkplatz',
    icon: '🅿️',
    desc: 'Verbessert Erreichbarkeit und Tagesgast-Kapazität.',
    cost: 3500,
    buildHours: 6,
    serviceCap: 38,
    upkeep: 35,
    prestige: 1,
    staff: 1,
    comfort: 2
  },
  rental: {
    id: 'rental',
    category: 'facility',
    name: 'Ski-Verleih',
    icon: '🎿',
    desc: 'Erhöht Umsatz pro Gast und macht Anfänger glücklicher.',
    cost: 5000,
    buildHours: 10,
    upkeep: 65,
    prestige: 2,
    staff: 2,
    comfort: 4,
    spend: 4,
    familyAppeal: 6
  },
  cafe: {
    id: 'cafe',
    category: 'facility',
    name: 'Berghütte',
    icon: '☕',
    desc: 'Steigert Komfort und Zusatzumsätze.',
    cost: 7000,
    buildHours: 12,
    upkeep: 70,
    prestige: 3,
    staff: 3,
    comfort: 5,
    spend: 5
  },
  patrol: {
    id: 'patrol',
    category: 'facility',
    name: 'Bergrettung',
    icon: '⛑️',
    desc: 'Senkt Unfallrisiko und hebt Reputation.',
    cost: 11000,
    buildHours: 14,
    upkeep: 90,
    prestige: 4,
    staff: 4,
    safety: 10
  },
  snowmaking: {
    id: 'snowmaking',
    category: 'facility',
    name: 'Beschneiungszentrale',
    icon: '❄️',
    desc: 'Stabilisiert Schneelage in warmen oder trockenen Phasen.',
    cost: 16000,
    buildHours: 18,
    upkeep: 180,
    prestige: 5,
    staff: 2,
    snowSupport: 12,
    power: 5,
    water: 6
  },
  hotel: {
    id: 'hotel',
    category: 'facility',
    name: 'Berghotel',
    icon: '🏨',
    desc: 'Bringt mehrtägige Gäste und Premium-Umsätze.',
    cost: 30000,
    buildHours: 32,
    serviceCap: 48,
    upkeep: 240,
    prestige: 11,
    staff: 7,
    comfort: 9,
    spend: 10,
    requires: { research: 'hospitality' }
  },
  shuttle: {
    id: 'shuttle',
    category: 'facility',
    name: 'Tal-Shuttle',
    icon: '🚌',
    desc: 'Verbessert Erreichbarkeit und macht Verbundgebiete attraktiver.',
    cost: 18000,
    buildHours: 16,
    serviceCap: 26,
    upkeep: 130,
    prestige: 5,
    staff: 3,
    comfort: 4,
    connectivity: 1,
    requires: { research: 'networking' }
  },
  solar: {
    id: 'solar',
    category: 'facility',
    name: 'Solarstation',
    icon: '🔋',
    desc: 'Senkt Energiekosten und verbessert Nachhaltigkeit.',
    cost: 26000,
    buildHours: 22,
    upkeep: 55,
    prestige: 7,
    staff: 1,
    eco: 8,
    requires: { research: 'green_energy' }
  },
  spa: {
    id: 'spa',
    category: 'facility',
    name: 'Spa & Wellness',
    icon: '🧖',
    desc: 'Starker Magnet für Komfort- und Luxusgäste.',
    cost: 42000,
    buildHours: 30,
    upkeep: 210,
    prestige: 10,
    staff: 5,
    comfort: 12,
    spend: 12,
    requires: { research: 'hospitality' }
  }
};

const SLOPES = {
  bunny: {
    id: 'bunny',
    name: 'Anfängerhang',
    icon: '🟢',
    desc: 'Sehr sicher, hohe Familiennachfrage.',
    cost: 2500,
    buildHours: 6,
    slopeCap: 28,
    appeal: 4,
    risk: 0.2,
    grooming: 18,
    familyAppeal: 9,
    expertAppeal: -2
  },
  blue: {
    id: 'blue',
    name: 'Blaue Piste',
    icon: '🔵',
    desc: 'Die klassische Wohlfühlabfahrt.',
    cost: 7000,
    buildHours: 10,
    slopeCap: 66,
    appeal: 7,
    risk: 0.35,
    grooming: 38,
    familyAppeal: 6,
    expertAppeal: 1
  },
  red: {
    id: 'red',
    name: 'Rote Piste',
    icon: '🔴',
    desc: 'Für sportliche Freizeitfahrer.',
    cost: 14000,
    buildHours: 16,
    slopeCap: 92,
    appeal: 12,
    risk: 0.55,
    grooming: 62,
    familyAppeal: -1,
    expertAppeal: 7
  },
  black: {
    id: 'black',
    name: 'Schwarze Piste',
    icon: '⚫',
    desc: 'Rufbringer für Experten, aber höheres Risiko.',
    cost: 26000,
    buildHours: 24,
    slopeCap: 104,
    appeal: 18,
    risk: 1.05,
    grooming: 92,
    familyAppeal: -8,
    expertAppeal: 14,
    requires: { minRegionAltitude: 1900 }
  },
  park: {
    id: 'park',
    name: 'Snowpark',
    icon: '🏂',
    desc: 'Magnet für junge Gäste und Marketingbilder.',
    cost: 21000,
    buildHours: 18,
    slopeCap: 74,
    appeal: 16,
    risk: 0.9,
    grooming: 86,
    familyAppeal: -3,
    expertAppeal: 11,
    requires: { research: 'park_design' }
  }
};

const RESEARCH = {
  fast_grooming: {
    id: 'fast_grooming',
    name: 'Digitale Pistenpflege',
    cost: 12000,
    desc: 'Pistenpflege wird günstiger und hebt Zufriedenheit.',
    effects: { groomingCostMult: -0.18, satisfactionFlat: 3 }
  },
  marketing: {
    id: 'marketing',
    name: 'Performance-Marketing',
    cost: 15000,
    desc: 'Dauerhaft mehr Nachfrage und stärkere Kampagnen.',
    effects: { demandMult: 0.12, campaignBonus: 0.18 }
  },
  safety_program: {
    id: 'safety_program',
    name: 'Sicherheitsprogramm',
    cost: 18000,
    desc: 'Weniger Unfälle und besseres Gästevertrauen.',
    effects: { safetyFlat: 10 }
  },
  express_lifts: {
    id: 'express_lifts',
    name: 'Express-Lifttechnik',
    cost: 35000,
    desc: 'Schaltet Gondeln frei und erhöht Liftkapazität.',
    effects: { liftCapMult: 0.14 }
  },
  hospitality: {
    id: 'hospitality',
    name: 'Hotel- & Hospitality-Standards',
    cost: 30000,
    desc: 'Schaltet Hotels und Spa frei, steigert Zusatzumsätze.',
    effects: { spendMult: 0.12, satisfactionFlat: 2 }
  },
  networking: {
    id: 'networking',
    name: 'Resort-Verbundsysteme',
    cost: 28000,
    desc: 'Shuttles und Verbundvorteile für mehrere Gebiete.',
    effects: { multiRegionDemand: 0.1 }
  },
  green_energy: {
    id: 'green_energy',
    name: 'Nachhaltige Energie',
    cost: 34000,
    desc: 'Senkt Betriebskosten und verbessert Reputation.',
    effects: { costMult: -0.08, repDaily: 0.4 }
  },
  park_design: {
    id: 'park_design',
    name: 'Snowpark-Design',
    cost: 25000,
    desc: 'Schaltet Snowparks frei und verbessert junge Zielgruppen.',
    effects: { demandMult: 0.05 }
  }
};

const OBJECTIVES = [
  { id: 'obj_money', label: 'Erreiche 100.000 €', check: state => state.money >= 100000 },
  { id: 'obj_rep', label: 'Erreiche 150 Reputation', check: state => state.reputation >= 150 },
  { id: 'obj_region', label: 'Schalte ein zweites Gebiet frei', check: state => getUnlockedRegions(state).length >= 2 },
  { id: 'obj_gondola', label: 'Baue eine Gondelbahn', check: state => totalStructure(state, 'gondola') >= 1 },
  { id: 'obj_hotel', label: 'Betreibe mindestens ein Hotel', check: state => totalStructure(state, 'hotel') >= 1 },
  { id: 'obj_safety', label: 'Forschung Sicherheitsprogramm', check: state => !!state.research.safety_program },
  { id: 'obj_prestige', label: 'Gründe deine erste Resort-Gruppe', check: state => state.prestige >= 1 }
];

const WEATHER_TYPES = [
  { key: 'bluebird', label: 'Blauer Himmel', demand: 1.14, snow: -2, risk: 0.85, note: 'Beste Sicht, starke Nachfrage.' },
  { key: 'cloudy', label: 'Bewölkt', demand: 1.0, snow: 0, risk: 1.0, note: 'Solider Standardtag.' },
  { key: 'snowfall', label: 'Schneefall', demand: 1.06, snow: 10, risk: 1.05, note: 'Pulverschnee lockt Fans an.' },
  { key: 'windy', label: 'Windig', demand: 0.86, snow: -1, risk: 1.12, note: 'Hohe Lagen leiden unter Wind.' },
  { key: 'warm', label: 'Warmfront', demand: 0.78, snow: -12, risk: 1.08, note: 'Schmelze drückt die Qualität.' },
  { key: 'storm', label: 'Sturm', demand: 0.62, snow: 5, risk: 1.28, note: 'Schwieriger Betriebstag.' }
];

const EVENT_POOL = [
  {
    id: 'holiday_rush',
    title: 'Ferienansturm',
    desc: 'Die Ferien beginnen. Familien und Tagesgäste strömen in deine Resorts.',
    durationDays: 3,
    effects: { demandMult: 0.22 }
  },
  {
    id: 'powder_alarm',
    title: 'Pulverschnee-Alarm',
    desc: 'Frischer Schnee sorgt für virale Bilder und volle Parkplätze.',
    durationDays: 2,
    effects: { demandMult: 0.18, snowFlat: 16 }
  },
  {
    id: 'energy_spike',
    title: 'Energiepreise steigen',
    desc: 'Der Betrieb der Bahnen wird kurzfristig teurer.',
    durationDays: 3,
    effects: { costMult: 0.16 }
  },
  {
    id: 'influencer_trip',
    title: 'Influencer-Skitrip',
    desc: 'Ein reichweitenstarker Trip steigert Bekanntheit und Buchungen.',
    durationDays: 4,
    effects: { demandMult: 0.14, repDaily: 1.2 }
  },
  {
    id: 'safety_audit',
    title: 'Sicherheitsinspektion',
    desc: 'Ordentliche Prozesse zahlen sich aus; schlechte Anlagen riskieren Imageschäden.',
    durationDays: 2,
    effects: { safetyFlat: 8 }
  }
];

let state = createInitialState();
let loopHandle = null;

function createRegion(id, unlocked = false) {
  const assets = Object.fromEntries(Object.keys(STRUCTURES).map(key => [key, 0]));
  const slopes = Object.fromEntries(Object.keys(SLOPES).map(key => [key, 0]));
  return {
    id,
    unlocked,
    snow: REGION_DEFS[id].snowBase,
    guestsToday: 0,
    lastRevenue: 0,
    lastCosts: 0,
    lastProfit: 0,
    lastAccidents: 0,
    satisfaction: 68,
    queue: [],
    assets,
    slopes,
    ops: {
      groomingBoostHours: 0,
      safetyBoostHours: 0,
      campaignBoostHours: 0
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
  regions.alpine_meadow.slopes.bunny = 1;
  regions.alpine_meadow.slopes.blue = 1;

  return {
    version: SAVE_VERSION,
    lastTimestamp: Date.now(),
    speed: 1,
    day: 1,
    hour: 8,
    seasonDay: 1,
    money: 42000,
    reputation: 14,
    prestige: 0,
    staff: 18,
    news: [{ day: 1, text: 'Willkommen in SkiTycoon V2. Aus einem kleinen Anfängerberg soll ein Alpenverbund werden.', type: 'info' }],
    activeEvents: [],
    weatherKey: 'bluebird',
    ticketMode: 'standard',
    ui: {
      tab: 'overview',
      region: 'alpine_meadow'
    },
    research: {},
    regions
  };
}

function getWeatherDef() {
  return WEATHER_TYPES.find(w => w.key === state.weatherKey) || WEATHER_TYPES[0];
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
  if (state.ticketMode === 'value') return { price: 28, demand: 1.08, satisfaction: 2 };
  if (state.ticketMode === 'premium') return { price: 44, demand: 0.88, satisfaction: -2 };
  return { price: 35, demand: 1, satisfaction: 0 };
}

function getBuildSpeedMult() {
  return 1 + state.prestige * 0.05;
}

function queueProject(regionId, kind, itemId) {
  const region = state.regions[regionId];
  const item = kind === 'structure' ? STRUCTURES[itemId] : SLOPES[itemId];
  if (!region || !region.unlocked || !item) return;
  if (!isAvailableInRegion(regionId, kind, itemId)) return;
  if (state.money < item.cost) return;

  state.money -= item.cost;
  const totalHours = Math.max(2, Math.round(item.buildHours / getBuildSpeedMult()));
  region.queue.push({
    kind,
    id: itemId,
    name: item.name,
    totalHours,
    hoursLeft: totalHours,
    cost: item.cost
  });
  addNews(`${REGION_DEFS[regionId].name}: Bau gestartet – ${item.name}.`, 'build');
  render();
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

function completeProject(region, project) {
  if (project.kind === 'structure') {
    region.assets[project.id] += 1;
  } else {
    region.slopes[project.id] += 1;
  }
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
  return Math.max(0.55, Math.min(1, factor));
}

function getRegionMetrics(region) {
  const def = REGION_DEFS[region.id];
  const ticket = getTicketConfig();
  const weather = getWeatherDef();
  const liftCap = sumRegionStat(region, 'liftCap') * (1 + getResearchEffect('liftCapMult'));
  const slopeCap = sumSlopeStat(region, 'slopeCap');
  const serviceCap = 20 + sumRegionStat(region, 'serviceCap');
  const baseCapacity = Math.max(0, Math.min(liftCap || 0, slopeCap || 0, serviceCap || 0));
  const comfort = sumRegionStat(region, 'comfort') + state.prestige * 2;
  const spendAdd = sumRegionStat(region, 'spend') * (1 + getResearchEffect('spendMult'));
  const safety = sumRegionStat(region, 'safety') + getResearchEffect('safetyFlat') + getActiveEffect('safetyFlat') + (region.ops.safetyBoostHours > 0 ? 8 : 0);
  const familyAppeal = sumRegionStat(region, 'familyAppeal') + sumSlopeStat(region, 'familyAppeal');
  const expertAppeal = sumSlopeStat(region, 'expertAppeal');
  const rawAppeal = def.appeal + sumRegionStat(region, 'prestige') + sumSlopeStat(region, 'appeal') + comfort * 0.9 + (familyAppeal * def.familyBias) + (expertAppeal * def.expertBias);
  const demandBase = (def.baseDemand + state.reputation * 0.28 + state.prestige * 8 + rawAppeal * 0.7)
    * ticket.demand
    * weather.demand
    * (1 + getResearchEffect('demandMult'))
    * (1 + getActiveEffect('demandMult'))
    * (1 + (region.ops.campaignBoostHours > 0 ? 0.16 + getResearchEffect('campaignBonus') : 0))
    * (1 + (getUnlockedRegions().length > 1 ? getResearchEffect('multiRegionDemand') : 0));
  const snowSupport = sumRegionStat(region, 'snowSupport') + getActiveEffect('snowFlat');
  const snowFactor = clamp(region.snow / 80, 0.45, 1.28);
  const windPenalty = (weather.key === 'windy' || weather.key === 'storm') ? (def.altitude > 2200 ? 0.82 : 0.92) : 1;
  const capacity = Math.round(baseCapacity * getStaffFactor() * windPenalty);
  const guests = Math.max(0, Math.round(Math.min(capacity, demandBase * snowFactor)));
  const waitPressure = capacity > 0 ? guests / capacity : 2;
  const accidents = Math.max(0, Math.round(guests * ((sumSlopeStat(region, 'risk') + weather.risk) / 170) * (1 - safety / 100)));
  const satisfaction = clamp(
    62
      + comfort * 0.8
      + ticket.satisfaction
      + getResearchEffect('satisfactionFlat')
      + (region.ops.groomingBoostHours > 0 ? 5 : 0)
      + Math.min(16, region.snow / 8)
      - (waitPressure > 0.88 ? (waitPressure - 0.88) * 55 : 0)
      - accidents * 2.2,
    12,
    98
  );
  const revenuePerGuest = ticket.price + spendAdd + comfort * 0.22;
  const powerUse = sumRegionStat(region, 'power');
  const waterUse = sumRegionStat(region, 'water');
  const upkeep = sumRegionStat(region, 'upkeep') + sumSlopeStat(region, 'grooming') * (1 + getResearchEffect('groomingCostMult')) + powerUse * 22 + waterUse * 12;
  const ecoDiscount = Math.max(-0.24, -sumRegionStat(region, 'eco') * 0.01 + getResearchEffect('costMult'));
  const costs = upkeep * (1 + ecoDiscount + getActiveEffect('costMult'));
  const revenue = guests * revenuePerGuest;
  const profit = revenue - costs;
  return {
    def,
    liftCap: Math.round(liftCap),
    slopeCap: Math.round(slopeCap),
    serviceCap: Math.round(serviceCap),
    capacity,
    guests,
    accidents,
    safety,
    comfort,
    satisfaction,
    revenue: Math.round(revenue),
    costs: Math.round(costs),
    profit: Math.round(profit),
    rawAppeal: Math.round(rawAppeal),
    snowSupport,
    waitPressure
  };
}

function nextWeatherKey() {
  const roll = Math.random();
  const seasonBias = state.seasonDay > 90 ? 0.12 : state.seasonDay < 25 ? 0.08 : 0;
  if (roll < 0.18) return 'snowfall';
  if (roll < 0.36) return 'bluebird';
  if (roll < 0.60) return 'cloudy';
  if (roll < 0.78) return 'windy';
  if (roll < 0.92 - seasonBias) return 'warm';
  return 'storm';
}

function simulateDay() {
  state.weatherKey = nextWeatherKey();
  const weather = getWeatherDef();
  let dailyGuests = 0;
  let dailyProfit = 0;
  let dailyAccidents = 0;
  const wages = state.staff * 28;

  getUnlockedRegions().forEach(region => {
    region.snow = clamp(region.snow + weather.snow + getRegionMetrics(region).snowSupport, 10, 120);
    const metrics = getRegionMetrics(region);
    region.guestsToday = metrics.guests;
    region.lastRevenue = metrics.revenue;
    region.lastCosts = metrics.costs;
    region.lastProfit = metrics.profit;
    region.lastAccidents = metrics.accidents;
    region.satisfaction = Math.round(metrics.satisfaction);
    dailyGuests += metrics.guests;
    dailyProfit += metrics.profit;
    dailyAccidents += metrics.accidents;
    region.ops.groomingBoostHours = Math.max(0, region.ops.groomingBoostHours - 24);
    region.ops.safetyBoostHours = Math.max(0, region.ops.safetyBoostHours - 24);
    region.ops.campaignBoostHours = Math.max(0, region.ops.campaignBoostHours - 24);
  });

  dailyProfit -= wages;
  state.money = Math.max(-50000, state.money + dailyProfit);
  state.reputation = clamp(
    state.reputation
      + dailyGuests * 0.008
      + getResearchEffect('repDaily')
      + getActiveEffect('repDaily')
      + (dailyAccidents === 0 ? 0.9 : 0)
      - dailyAccidents * 0.28
      + (dailyProfit > 0 ? 0.2 : -0.1),
    0,
    9999
  );

  if (state.day % 4 === 0 && Math.random() < 0.58) {
    triggerRandomEvent();
  }
  tickEvents(24);

  if (dailyGuests > 0) {
    addNews(`Tag ${state.day}: ${dailyGuests} Gäste, ${formatMoney(dailyProfit)} Tagesergebnis, Wetter: ${weather.label}.`, dailyProfit >= 0 ? 'success' : 'warn');
  }
  if (dailyAccidents >= 6) {
    addNews(`Achtung: ${dailyAccidents} Unfälle an einem Tag. Mehr Bergrettung und Sicherheit lohnen sich.`, 'warn');
  }
}

function tickEvents(hours) {
  state.activeEvents = state.activeEvents
    .map(event => ({ ...event, hoursLeft: event.hoursLeft - hours }))
    .filter(event => event.hoursLeft > 0);
}

function triggerRandomEvent() {
  const pool = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
  state.activeEvents.push({
    id: `${pool.id}_${Date.now()}`,
    title: pool.title,
    desc: pool.desc,
    effects: { ...pool.effects },
    hoursLeft: pool.durationDays * 24
  });
  addNews(`Event: ${pool.title} – ${pool.desc}`, 'event');
}

function simHour(count = 1) {
  for (let i = 0; i < count; i += 1) {
    progressQueues(1);
    state.hour += 1;
    if (state.hour >= 24) {
      state.hour = 0;
      state.day += 1;
      state.seasonDay += 1;
      if (state.seasonDay > 120) state.seasonDay = 1;
      simulateDay();
    }
  }
}

function addNews(text, type = 'info') {
  state.news.unshift({ day: state.day, text, type });
  state.news = state.news.slice(0, 60);
}

function buyResearch(id) {
  const item = RESEARCH[id];
  if (!item || state.research[id] || state.money < item.cost) return;
  state.money -= item.cost;
  state.research[id] = true;
  addNews(`Forschung abgeschlossen: ${item.name}.`, 'success');
  render();
}

function hireStaff() {
  const price = 1200 + state.staff * 140;
  if (state.money < price) return;
  state.money -= price;
  state.staff += 1;
  addNews(`Neues Personal eingestellt. Gesamtpersonal: ${state.staff}.`, 'success');
  render();
}

function fireStaff() {
  if (state.staff <= 6) return;
  state.staff -= 1;
  addNews(`Ein Mitarbeiter wurde abgebaut. Gesamtpersonal: ${state.staff}.`, 'warn');
  render();
}

function startMarketing() {
  const cost = 9000;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.campaignBoostHours = Math.max(region.ops.campaignBoostHours, 72); });
  addNews('Marketingkampagne gestartet. Nachfrage steigt für drei Tage.', 'event');
  render();
}

function groomAll() {
  const cost = 5000 + getUnlockedRegions().length * 1200;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.groomingBoostHours = Math.max(region.ops.groomingBoostHours, 48); });
  addNews('Alle Pisten frisch präpariert. Zufriedenheit steigt kurzfristig.', 'success');
  render();
}

function safetyInspection() {
  const cost = 4500;
  if (state.money < cost) return;
  state.money -= cost;
  getUnlockedRegions().forEach(region => { region.ops.safetyBoostHours = Math.max(region.ops.safetyBoostHours, 72); });
  addNews('Sicherheitsinspektion durchgeführt. Risiko sinkt für drei Tage.', 'success');
  render();
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
  region.slopes.blue = 1;
  addNews(`Neues Gebiet erschlossen: ${def.name}.`, 'success');
  render();
}

function doPrestige() {
  if (state.reputation < 250 || state.money < 500000) return;
  const oldPrestige = state.prestige + 1;
  state = createInitialState();
  state.prestige = oldPrestige;
  state.money = 50000 + oldPrestige * 12000;
  state.reputation = 20 + oldPrestige * 8;
  addNews(`Neue Resort-Gruppe gegründet. Prestige ${state.prestige} aktiv.`, 'success');
  render();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatInt(value) {
  return new Intl.NumberFormat('de-DE').format(Math.round(value));
}

function formatHours(hours) {
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  if (days > 0) return `${days}T ${rest}h`;
  return `${rest}h`;
}

function saveGame() {
  state.lastTimestamp = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    render();
  } catch {
    alert('Import fehlgeschlagen.');
  }
}

function resetGame() {
  if (!confirm('Wirklich alles zurücksetzen?')) return;
  state = createInitialState();
  saveGame();
  render();
}

function getSummary() {
  const unlocked = getUnlockedRegions();
  const guests = unlocked.reduce((sum, region) => sum + region.guestsToday, 0);
  const profit = unlocked.reduce((sum, region) => sum + region.lastProfit, 0) - state.staff * 28;
  const avgSatisfaction = unlocked.length ? unlocked.reduce((sum, region) => sum + region.satisfaction, 0) / unlocked.length : 0;
  return {
    guests,
    profit,
    avgSatisfaction,
    staffNeed: getGlobalStaffNeed(),
    weather: getWeatherDef()
  };
}

function renderStats() {
  const summary = getSummary();
  const stats = [
    { label: 'Geld', value: formatMoney(state.money), sub: `Prestige ${state.prestige}` },
    { label: 'Reputation', value: formatInt(state.reputation), sub: 'Markenstärke deiner Gruppe' },
    { label: 'Tag / Uhrzeit', value: `Tag ${state.day}`, sub: `${String(state.hour).padStart(2, '0')}:00 Uhr` },
    { label: 'Wetter', value: summary.weather.label, sub: summary.weather.note },
    { label: 'Gäste heute', value: formatInt(summary.guests), sub: 'Über alle offenen Gebiete' },
    { label: 'Tagesergebnis', value: formatMoney(summary.profit), sub: summary.profit >= 0 ? 'Operativ im Plus' : 'Operativ im Minus' },
    { label: 'Personal', value: `${state.staff} / ${summary.staffNeed}`, sub: summary.staffNeed > state.staff ? 'Zu wenig Personal' : 'Ausreichend besetzt' },
    { label: 'Ø Zufriedenheit', value: `${formatInt(summary.avgSatisfaction)}%`, sub: 'Durchschnitt über alle Gebiete' }
  ];
  document.getElementById('stats-grid').innerHTML = stats.map(stat => `
    <div class="stat-card">
      <div class="stat-label">${stat.label}</div>
      <div class="stat-value">${stat.value}</div>
      <div class="stat-sub">${stat.sub}</div>
    </div>
  `).join('');
  document.getElementById('headline-status').textContent = `${getUnlockedRegions().length} aktive Gebiete · ${Object.keys(state.research).filter(k => state.research[k]).length} Forschungen · Ticketmodus: ${ticketModeLabel(state.ticketMode)}`;
}

function ticketModeLabel(mode) {
  if (mode === 'value') return 'Günstig';
  if (mode === 'premium') return 'Premium';
  return 'Standard';
}

function renderOverview() {
  const objectives = OBJECTIVES.map(obj => {
    const done = obj.check(state);
    return `<div class="objective"><div class="news-meta"><strong>${obj.label}</strong><span class="tag ${done ? 'good' : ''}">${done ? 'Erledigt' : 'Offen'}</span></div></div>`;
  }).join('');

  const regionCards = getUnlockedRegions().map(region => {
    const metrics = getRegionMetrics(region);
    return `
      <div class="region-card">
        <div class="region-title">
          <div>
            <h3>${REGION_DEFS[region.id].name}</h3>
            <p class="muted small">${REGION_DEFS[region.id].specialty}</p>
          </div>
          <span class="tag ${region.lastProfit >= 0 ? 'good' : region.lastProfit < -1000 ? 'bad' : 'warn'}">${formatMoney(region.lastProfit)}</span>
        </div>
        <div class="detail-list">
          <div class="detail-item"><span>Gäste heute</span><strong>${formatInt(region.guestsToday)}</strong></div>
          <div class="detail-item"><span>Schnee</span><strong>${formatInt(region.snow)} cm</strong></div>
          <div class="detail-item"><span>Zufriedenheit</span><strong>${region.satisfaction}%</strong></div>
          <div class="detail-item"><span>Kapazität</span><strong>${formatInt(metrics.capacity)}</strong></div>
          <div class="detail-item"><span>Unfälle</span><strong>${formatInt(region.lastAccidents)}</strong></div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="hero-panel">
      <p class="eyebrow">Resort-Vision</p>
      <h2>Vom Dorflift zum Alpenverbund</h2>
      <p>Baue Lifte, Pisten, Hotels, Sicherheit und ein Netz aus spezialisierten Bergen. Dein Ziel ist nicht nur Geld, sondern eine Resort-Gruppe mit echter Identität, stabiler Auslastung und Prestige.</p>
      <div class="inline-actions" style="margin-top:16px;">
        <button class="primary-btn" data-action="tab" data-tab="build">Jetzt bauen</button>
        <button class="secondary-btn" data-action="marketing">Marketingkampagne</button>
        <button class="ghost-btn" data-action="prestige" ${state.reputation < 250 || state.money < 500000 ? 'disabled' : ''}>Neue Resort-Gruppe gründen</button>
      </div>
    </section>

    <div class="overview-grid" style="margin-top:14px;">
      <div class="card">
        <div class="card-title"><h3 class="section-title">Ziele</h3><span class="tag">${OBJECTIVES.filter(o => o.check(state)).length}/${OBJECTIVES.length}</span></div>
        <div class="objective-list">${objectives}</div>
      </div>
      <div class="card">
        <div class="card-title"><h3 class="section-title">Aktive Modifier</h3><span class="tag">${state.activeEvents.length}</span></div>
        <div class="banner-list">${renderActiveEventsCompact()}</div>
      </div>
    </div>

    <div class="region-grid" style="margin-top:14px;">${regionCards}</div>
  `;
}

function renderActiveEventsCompact() {
  if (!state.activeEvents.length) {
    return '<div class="event-banner"><div class="event-meta"><span>Keine aktiven Events</span><span class="tag">ruhig</span></div><p class="muted">Gerade läuft kein globales Sonderereignis.</p></div>';
  }
  return state.activeEvents.map(event => `
    <div class="event-banner">
      <div class="event-meta"><strong>${event.title}</strong><span class="tag">${formatHours(event.hoursLeft)}</span></div>
      <p class="muted small">${event.desc}</p>
    </div>
  `).join('');
}

function renderBuild() {
  const region = state.regions[state.ui.region] || getUnlockedRegions()[0];
  const metrics = getRegionMetrics(region);
  const structureCards = Object.values(STRUCTURES).map(item => renderBuildCard(region, 'structure', item)).join('');
  const slopeCards = Object.values(SLOPES).map(item => renderBuildCard(region, 'slope', item)).join('');
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
          <div class="detail-item"><span>Schnee</span><strong>${formatInt(region.snow)} cm</strong></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Bauqueue</h3><span class="tag">${region.queue.length}</span></div>
        <div class="queue-list">${queue}</div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-title"><h3>Lifte & Infrastruktur</h3><span class="tag">${Object.values(region.assets).reduce((a,b)=>a+b,0)} gebaut</span></div>
      <div class="build-grid">${structureCards}</div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-title"><h3>Pisten</h3><span class="tag">${Object.values(region.slopes).reduce((a,b)=>a+b,0)} angelegt</span></div>
      <div class="build-grid">${slopeCards}</div>
    </div>
  `;
}

function renderBuildCard(region, kind, item) {
  const current = kind === 'structure' ? region.assets[item.id] : region.slopes[item.id];
  const available = isAvailableInRegion(region.id, kind, item.id);
  const affordable = state.money >= item.cost;
  const disabled = !available || !affordable;
  const badges = [];
  if (item.liftCap) badges.push(`Lift ${item.liftCap}`);
  if (item.serviceCap) badges.push(`Service ${item.serviceCap}`);
  if (item.slopeCap) badges.push(`Piste ${item.slopeCap}`);
  if (item.safety) badges.push(`Sicherheit +${item.safety}`);
  if (item.snowSupport) badges.push(`Schnee +${item.snowSupport}`);
  if (item.comfort) badges.push(`Komfort +${item.comfort}`);
  const reqText = !available ? '<span class="tag bad">Anforderung fehlt</span>' : '';

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
        ${reqText}
      </div>
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
      <h2>Technologie, Komfort und Effizienz</h2>
      <p>Schalte Gondeln, Hotels, Snowparks, nachhaltige Energie und bessere Operations-Tools frei. Forschung ist dein Midgame-Motor.</p>
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
        </div>
        <div class="detail-list" style="margin-top:14px;">
          <div class="detail-item"><span>Personal</span><strong>${state.staff} verfügbar</strong></div>
          <div class="detail-item"><span>Benötigt</span><strong>${summary.staffNeed}</strong></div>
          <div class="detail-item"><span>Ticketmodus</span><strong>${ticketModeLabel(state.ticketMode)}</strong></div>
        </div>
        <div class="segmented" style="margin-top:14px;">
          <button class="chip-btn ${state.ticketMode === 'value' ? 'active' : ''}" data-action="ticket" data-mode="value">Günstig</button>
          <button class="chip-btn ${state.ticketMode === 'standard' ? 'active' : ''}" data-action="ticket" data-mode="standard">Standard</button>
          <button class="chip-btn ${state.ticketMode === 'premium' ? 'active' : ''}" data-action="ticket" data-mode="premium">Premium</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title"><h3>Heutige Lage</h3><span class="tag">${getWeatherDef().label}</span></div>
        <div class="detail-list">
          <div class="detail-item"><span>Gäste heute</span><strong>${formatInt(summary.guests)}</strong></div>
          <div class="detail-item"><span>Tagesergebnis</span><strong>${formatMoney(summary.profit)}</strong></div>
          <div class="detail-item"><span>Ø Zufriedenheit</span><strong>${formatInt(summary.avgSatisfaction)}%</strong></div>
          <div class="detail-item"><span>Aktive Events</span><strong>${state.activeEvents.length}</strong></div>
        </div>
      </div>
    </div>
  `;
}

function renderRegions() {
  const cards = Object.values(REGION_DEFS).map(def => {
    const region = state.regions[def.id];
    const unlocked = region.unlocked;
    return `
      <div class="region-card">
        <div class="region-title">
          <div>
            <h3>${def.name}</h3>
            <p class="muted small">${def.specialty}</p>
          </div>
          <span class="tag ${unlocked ? 'good' : ''}">${unlocked ? 'Offen' : 'Gesperrt'}</span>
        </div>
        <p class="muted small">${def.description}</p>
        <div class="detail-list" style="margin-top:12px;">
          <div class="detail-item"><span>Höhe</span><strong>${def.altitude} m</strong></div>
          <div class="detail-item"><span>Schnee-Basis</span><strong>${def.snowBase} cm</strong></div>
          <div class="detail-item"><span>Freischaltkosten</span><strong>${formatMoney(def.unlockCost)}</strong></div>
        </div>
        <div class="inline-actions" style="margin-top:12px;">
          <button class="primary-btn" data-action="unlock-region" data-id="${def.id}" ${unlocked || state.money < def.unlockCost ? 'disabled' : ''}>Freischalten</button>
          ${unlocked ? `<button class="ghost-btn" data-action="select-region" data-region="${def.id}">Ansehen</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  return `
    <section class="hero-panel">
      <p class="eyebrow">Expansion</p>
      <h2>Mehrere Berge, mehrere Identitäten</h2>
      <p>Jedes Gebiet hat eigene Höhe, Zielgruppe und wirtschaftliche Rolle. Genau daraus entsteht das Strategiespiel hinter deinem Resort-Verbund.</p>
    </section>
    <div class="region-grid" style="margin-top:14px;">${cards}</div>
  `;
}

function renderEvents() {
  const news = state.news.map(entry => `
    <div class="news-item">
      <div class="news-meta"><span>Tag ${entry.day}</span><span class="tag ${entry.type === 'success' ? 'good' : entry.type === 'warn' ? 'warn' : ''}">${entry.type}</span></div>
      <p>${entry.text}</p>
    </div>
  `).join('');
  return `
    <div class="events-grid">
      <div class="card">
        <div class="card-title"><h3>Aktive Events</h3><span class="tag">${state.activeEvents.length}</span></div>
        <div class="banner-list">${renderActiveEventsCompact()}</div>
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
        <p class="muted small" style="margin-top:14px;">Das Spiel speichert automatisch lokal im Browser. Export/Import ist für manuelle Backups gedacht.</p>
      </div>
      <div class="card">
        <div class="card-title"><h3>Prestige</h3><span class="tag">Meta</span></div>
        <div class="detail-list">
          <div class="detail-item"><span>Aktuelles Prestige</span><strong>${state.prestige}</strong></div>
          <div class="detail-item"><span>Nächste Voraussetzung</span><strong>250 Rep & 500.000 €</strong></div>
          <div class="detail-item"><span>Bonus pro Prestige</span><strong>+5% Baugeschwindigkeit, +8 Start-Reputation</strong></div>
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
  if (action === 'select-region') state.ui.region = button.dataset.region;
  if (action === 'build') queueProject(state.ui.region, button.dataset.kind, button.dataset.id);
  if (action === 'research') buyResearch(button.dataset.id);
  if (action === 'hire-staff') hireStaff();
  if (action === 'fire-staff') fireStaff();
  if (action === 'marketing') startMarketing();
  if (action === 'groom') groomAll();
  if (action === 'inspect') safetyInspection();
  if (action === 'unlock-region') unlockRegion(button.dataset.id);
  if (action === 'ticket') state.ticketMode = button.dataset.mode;
  if (action === 'speed') state.speed = Number(button.dataset.speed || 1);
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
