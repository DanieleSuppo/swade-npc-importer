import { getActorAddtionalStats, getSpecificAdditionalStat } from "../foundryActions.js";
// import * as statEntities from "../utils/statblockEntities.js";
import * as regexs from "../utils/regexs.js";
import { SpecialAbilitiesForDescription } from "./buildActorItemsSpecialAbilities.js"
import { additionalStatsBuilder } from "./itemBuilder.js";

export const BuildActorData = async function (parsedData, isWildCard) {
    var data = {};

    data.attributes = generateAttributes(parsedData),
        data.stats = {
            speed: {
                runningDie: findRunningDie(parsedData[game.i18n.localize("Parser.SpecialAbilities")]),
                value: parsedData.Pace
            },
            toughness: {
                value: parsedData.Toughness
            },
            parry: { value: parsedData.Parry },
            size: parsedData.Size
        }
    data.details = {
        biography: {
            value: buildBioAndSpecialAbilities(parsedData)
        },
        autoCalcToughness: true
    }
    data.powerPoints = {
        value: parsedData[game.i18n.localize("Parser.PowerPoints")],
        max: parsedData[game.i18n.localize("Parser.PowerPoints")]
    }
    data.wounds = {
        max: calculateWoundMod(parsedData.Size, isWildCard),
        ignored: calculateIgnoredWounds(parsedData)
    }
    data.initiative = initiativeMod(parsedData.Edges);
    data.wildcard = isWildCard;
    data.additionalStats = await buildAdditionalStats(parsedData)

    return data;
}

function generateAttributes(parsedData) {
    let attributesData = parsedData.Attributes;

    if (parsedData.Attributes.animalSmarts == true) {
        attributesData.smarts.animal = true;
    }

    let unShakeBonus = findUnshakeBonus(parsedData);
    if (unShakeBonus != undefined) {
        attributesData.spirit.unShakeBonus = unShakeBonus;
    }

    return attributesData;
}

function buildBioAndSpecialAbilities(parsedData) {
    if (parsedData[game.i18n.localize("Parser.SpecialAbilities")] != undefined) {
        let specialAbsHtml = SpecialAbilitiesForDescription(parsedData[game.i18n.localize("Parser.SpecialAbilities")])
        return parsedData.Biography.value.concat(specialAbsHtml);
    }
    return parsedData.Biography.value;
}

async function buildAdditionalStats(parsedData) {
    let additionalStats = {};
    let actorSystemStats = getActorAddtionalStats();
    actorSystemStats.forEach(element => {
        let statName = element.replace(':', '');
        let statValue = parsedData[statName];
        if (statValue !== undefined) {
            additionalStats[statName] = additionalStatsBuilder(statName, statValue)
        }
    });
    return additionalStats;
}

function calculateWoundMod(size, isWildCard) {
    var baseWounds = isWildCard ? 3 : 1;
    if (size >= 4 && size <= 7) {
        baseWounds += 1;
    }
    if (size >= 8 && size <= 11) {
        baseWounds += 2;
    }
    if (size >= 12) {
        baseWounds += 3;
    }

    return baseWounds;
}

function initiativeMod(edges) {
    if (edges != undefined) {
        let hasHesitant = false;
        let hasLevelHeaded = false;
        let hasImpLevelHeaded = false;
        edges.forEach(element => {
            if (element.includes(game.i18n.localize("Parser.Hesitant"))) {
                hasHesitant = true;
            }
            if (element.includes(game.i18n.localize("Parser.LevelHeaded"))) {
                hasLevelHeaded = true;
            }
            if (element.includes(game.i18n.localize("Parser.LevelHeadedImp"))) {
                hasImpLevelHeaded = true;
            }
        });

        return {
            "hasHesitant": hasHesitant,
            "hasLevelHeaded": hasLevelHeaded,
            "hasImpLevelHeaded": hasImpLevelHeaded
        }
    }
}

function findRunningDie(abilities) {
    for (const ability in abilities) {
        if (ability.toLowerCase().includes(game.i18n.localize("Parser.SpecialAbilities"))) {
            return parseInt(abilities[ability].match(regexs.diceRegex)[0].replace('d', ''))
        }
    }
}

function calculateIgnoredWounds(parsedData) {
    const IgnoreWound = [
        `${game.i18n.localize("Parser.undead")}`,
        `${game.i18n.localize("Parser.construct")}`,
        `${game.i18n.localize("Parser.elemental")}`
    ];

    let bonusTotal = 0;
    for (const ability in parsedData[game.i18n.localize("Parser.SpecialAbilities")]) {
        if (IgnoreWound.includes((ability.toLowerCase()))) {
            bonusTotal += 1;
        }
    }
    return bonusTotal;
}

function findUnshakeBonus(parsedData) {
    const UnshakeBonus = [
        `${game.i18n.localize("Parser.undead")}`,
        `${game.i18n.localize("Parser.construct")}`,
        `${game.i18n.localize("Parser.combatReflexes")}`
    ];

    let bonusTotal = 0;
    for (const ability in parsedData[game.i18n.localize("Parser.SpecialAbilities")]) {
        if (UnshakeBonus.includes((ability.toLowerCase()))) {
            bonusTotal += 2;
        }
    }

    if (parsedData.Edges != undefined) {
        parsedData.Edges.forEach(edge => {
            if (UnshakeBonus.includes((edge.toLowerCase()))) {
                bonusTotal += 2;
            }
        });
    }


    return bonusTotal;
}
