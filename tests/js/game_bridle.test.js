import { describe, it, expect } from "vitest";
import { formatMoney } from "../../games/game_bridle/js/format.js";
import {
  UPGRADE_CONFIG,
  nextUpgradeCost,
  brickHpForLevel,
  brickValue,
  computeDps,
  estimateOfflineIncome,
  canPrestige,
  prestigeGemsForLevel,
  prestigeMultiplierForGems,
  computeHitDamage,
  hitReward,
  brickKillReward,
  splashDamage,
} from "../../games/game_bridle/js/economy.js";
import {
  createInitialState,
  createInitialUpgrades,
  serializeState,
  applySave,
} from "../../games/game_bridle/js/state.js";

describe("formatMoney", () => {
  it("formats amounts under 1k as whole dollars", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(5)).toBe("$5");
    expect(formatMoney(999)).toBe("$999");
  });

  it("formats thousands with a k suffix", () => {
    expect(formatMoney(1000)).toBe("$1.00k");
    expect(formatMoney(1500)).toBe("$1.50k");
    expect(formatMoney(123456)).toBe("$123.46k");
  });

  it("formats millions with an M suffix", () => {
    expect(formatMoney(1e6)).toBe("$1.00M");
    expect(formatMoney(2.5e6)).toBe("$2.50M");
  });

  it("formats billions with a B suffix", () => {
    expect(formatMoney(1e9)).toBe("$1.00B");
    expect(formatMoney(3.456e9)).toBe("$3.46B");
  });
});

describe("nextUpgradeCost", () => {
  it("grows each upgrade by its configured rate", () => {
    expect(nextUpgradeCost(10, 1, UPGRADE_CONFIG.balls.growthRate)).toBe(15);
    expect(nextUpgradeCost(50, 1, UPGRADE_CONFIG.power.growthRate)).toBe(65);
    expect(nextUpgradeCost(100, 2, UPGRADE_CONFIG.speed.growthRate)).toBe(195);
    expect(nextUpgradeCost(200, 1, UPGRADE_CONFIG.income.growthRate)).toBe(280);
    expect(nextUpgradeCost(1000, 0, UPGRADE_CONFIG.splash.growthRate)).toBe(1000);
    expect(nextUpgradeCost(1000, 3, UPGRADE_CONFIG.splash.growthRate)).toBe(8000);
  });
});

describe("brickHpForLevel", () => {
  it("starts at 10 HP on level 1", () => {
    expect(brickHpForLevel(1)).toBe(10);
  });

  it("grows by 15% per level, floored", () => {
    expect(brickHpForLevel(2)).toBe(11);
    expect(brickHpForLevel(3)).toBe(13);
    expect(brickHpForLevel(5)).toBe(17);
    expect(brickHpForLevel(11)).toBe(40);
  });
});

describe("brickValue", () => {
  it("is half the brick HP, rounded up", () => {
    expect(brickValue(10)).toBe(5);
    expect(brickValue(11)).toBe(6);
    expect(brickValue(1)).toBe(1);
  });
});

describe("computeDps", () => {
  it("is balls times damage times prestige multiplier", () => {
    expect(computeDps(2, 3, 1.5)).toBe(9);
    expect(computeDps(1, 1, 1)).toBe(1);
  });
});

describe("estimateOfflineIncome", () => {
  it("applies the 50% offline efficiency over time away", () => {
    expect(estimateOfflineIncome(2, 3, 1.5, 2, 120)).toBe(1080);
  });

  it("is zero with no balls", () => {
    expect(estimateOfflineIncome(0, 3, 1.5, 2, 120)).toBe(0);
  });
});

describe("prestige math", () => {
  it("requires level 50", () => {
    expect(canPrestige(49)).toBe(false);
    expect(canPrestige(50)).toBe(true);
    expect(canPrestige(120)).toBe(true);
  });

  it("grants one gem per 10 levels", () => {
    expect(prestigeGemsForLevel(50)).toBe(5);
    expect(prestigeGemsForLevel(99)).toBe(9);
    expect(prestigeGemsForLevel(100)).toBe(10);
    expect(prestigeGemsForLevel(149)).toBe(14);
  });

  it("grants a 10% damage multiplier per gem", () => {
    expect(prestigeMultiplierForGems(0)).toBe(1);
    expect(prestigeMultiplierForGems(5)).toBe(1.5);
    expect(prestigeMultiplierForGems(10)).toBe(2);
  });
});

describe("hit rewards", () => {
  it("computeHitDamage triples damage on crits", () => {
    expect(computeHitDamage(2, 1.5, false)).toBe(3);
    expect(computeHitDamage(2, 1.5, true)).toBe(9);
  });

  it("hitReward scales with the income multiplier", () => {
    expect(hitReward(1)).toBe(1);
    expect(hitReward(2)).toBe(2);
  });

  it("brickKillReward pays 10x the brick value, scaled by income", () => {
    expect(brickKillReward(5, 2)).toBe(100);
  });

  it("splashDamage deals half the primary damage", () => {
    expect(splashDamage(10)).toBe(5);
  });
});

describe("createInitialState", () => {
  it("starts a fresh game with default values", () => {
    const state = createInitialState(1000);
    expect(state.money).toBe(0);
    expect(state.level).toBe(1);
    expect(state.damage).toBe(1);
    expect(state.speed).toBe(4);
    expect(state.incomeMult).toBe(1);
    expect(state.splashRange).toBe(0);
    expect(state.prestige).toEqual({ count: 0, multiplier: 1.0 });
    expect(state.upgrades).toEqual(createInitialUpgrades());
    expect(state.balls).toEqual([]);
    expect(state.bricks).toEqual([]);
    expect(state.particles).toEqual([]);
    expect(state.floatingTexts).toEqual([]);
    expect(state.lastTime).toBe(1000);
  });

  it("createInitialUpgrades matches the shop's starting costs", () => {
    expect(createInitialUpgrades()).toEqual({
      balls: { level: 1, cost: 10, baseCost: 10 },
      power: { level: 1, cost: 50, baseCost: 50 },
      speed: { level: 1, cost: 100, baseCost: 100 },
      income: { level: 1, cost: 200, baseCost: 200 },
      splash: { level: 0, cost: 1000, baseCost: 1000 },
    });
  });
});

describe("save/load round-trip", () => {
  it("serializeState captures the saveable fields", () => {
    const state = createInitialState(1000);
    state.money = 5000;
    state.level = 7;
    state.damage = 4;
    state.speed = 5;
    state.incomeMult = 1.5;
    state.splashRange = 25;
    state.prestige = { count: 3, multiplier: 1.3 };
    state.balls = [{}, {}];

    const save = serializeState(state, 2000);

    expect(save).toEqual({
      money: 5000,
      level: 7,
      damage: 4,
      speed: 5,
      incomeMult: 1.5,
      splashRange: 25,
      prestige: { count: 3, multiplier: 1.3 },
      upgrades: state.upgrades,
      ballCount: 2,
      lastTime: 2000,
    });
  });

  it("applySave restores a serialized state", () => {
    const state = createInitialState(1000);
    state.money = 5000;
    state.level = 7;
    state.damage = 4;
    state.speed = 5;
    state.incomeMult = 1.5;
    state.splashRange = 25;
    state.prestige = { count: 3, multiplier: 1.3 };
    const save = serializeState(state, 2000);

    const restored = applySave(createInitialState(3000), save, 3000);

    expect(restored.money).toBe(5000);
    expect(restored.level).toBe(7);
    expect(restored.damage).toBe(4);
    expect(restored.speed).toBe(5);
    expect(restored.incomeMult).toBe(1.5);
    expect(restored.splashRange).toBe(25);
    expect(restored.prestige).toEqual({ count: 3, multiplier: 1.3 });
    expect(restored.upgrades).toEqual(state.upgrades);
    expect(restored.lastTime).toBe(3000);
    expect(restored.balls).toEqual([]);
  });

  it("applySave falls back to defaults for missing fields", () => {
    const current = createInitialState(1000);
    const restored = applySave(current, {});

    expect(restored.money).toBe(0);
    expect(restored.level).toBe(1);
    expect(restored.damage).toBe(1);
    expect(restored.speed).toBe(4);
    expect(restored.incomeMult).toBe(1);
    expect(restored.splashRange).toBe(0);
    expect(restored.prestige).toEqual({ count: 0, multiplier: 1.0 });
    expect(restored.upgrades).toBe(current.upgrades);
  });

  it("applySave keeps the current upgrades when the save has none", () => {
    const current = createInitialState(1000);
    const restored = applySave(current, { money: 100 });

    expect(restored.money).toBe(100);
    expect(restored.upgrades).toBe(current.upgrades);
  });

  it("applySave does not mutate the input state", () => {
    const current = createInitialState(1000);
    const snapshot = JSON.stringify(current);

    applySave(current, { money: 42 });

    expect(JSON.stringify(current)).toBe(snapshot);
  });
});
