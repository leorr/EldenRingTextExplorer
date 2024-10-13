
import xml2js from 'xml2js';
import { promises as fs } from 'fs';


const collectables = [

];

// name, title,
// info,
// caption, body
// effect, info2
// dialog,

// group, name, info, caption, effect, dialog
const fileGroups = [
    {group: "accessories", name: "AccessoryName", info: "AccessoryInfo", caption: "AccessoryCaption" },
    {group: "arts", name: "ArtsName", caption: "ArtsCaption" },
    {group: "gems", name: "GemName", caption: "GemCaption", effect: "GemEffect", info: "GemInfo" },
    {group: "goods", name: "GoodsName", caption: "GoodsCaption", effect: "GoodsInfo2", info: "GoodsInfo", dialog: "GoodsDialog" },
    {group: "loading", name: "LoadingTitle", caption: "LoadingText" },
    {group: "protector", name: "ProtectorName", caption: "ProtectorCaption", info: "ProtectorInfo" },
    {group: "weapon", name: "WeaponName", caption: "WeaponCaption", effect: "WeaponEffect", info: "WeaponInfo" },
    {group: "npcs", name: "NpcName"},
    {group: "places", name: "PlaceName"},
    {group: "dialog", info: "TalkMsg"},

    //dlc stuff
    { group: "accessories_dlc01", name: "AccessoryName_dlc01", info: "AccessoryInfo_dlc01", caption: "AccessoryCaption_dlc01" },
    { group: "arts_dlc01", name: "ArtsName_dlc01", caption: "ArtsCaption_dlc01" },
    { group: "gems_dlc01", name: "GemName_dlc01", caption: "GemCaption_dlc01", effect: "GemEffect_dlc01", info: "GemInfo_dlc01" },
    { group: "goods_dlc01", name: "GoodsName_dlc01", caption: "GoodsCaption_dlc01", effect: "GoodsInfo2_dlc01", info: "GoodsInfo_dlc01", dialog: "GoodsDialog_dlc01" },
    { group: "loading_dlc01", name: "LoadingTitle_dlc01", caption: "LoadingText_dlc01" },
    { group: "protector_dlc01", name: "ProtectorName_dlc01", caption: "ProtectorCaption_dlc01", info: "ProtectorInfo_dlc01" },
    { group: "weapon_dlc01", name: "WeaponName_dlc01", caption: "WeaponCaption_dlc01", effect: "WeaponEffect_dlc01", info: "WeaponInfo_dlc01" },
    { group: "npcs_dlc01", name: "NpcName_dlc01"},
    { group: "places_dlc01", name: "PlaceName_dlc01"},
    //{ group: "dialog_dlc01", info: "TalkMsg_dlc01"}, //todo fix later
];

const loadFile = (() => {
    const fileCache = {};
    return async fileName => {
        if (!fileName) return {};
        if (fileCache[fileName]) return fileCache[fileName];
        const xml_en = await fs.readFile(`text_dump_en/${fileName}.fmg.xml`);
        const result_en = await xml2js.parseStringPromise(xml_en);
        const items = {};
        for (let i in result_en.fmg.entries[0].text) {
            const en = result_en.fmg.entries[0].text[i];
            if (en._ == "%null%") continue;
            items[en.$.id] = {en: en._};
        }
        fileCache[fileName] = items;
        return items;
    };
})();

//const loadFileGroups = async toLoad => {
//    const loadableProps = ["name", "info", "caption", "effect", "dialog"];
//    const groups = {};
//    for (let nextGroup of toLoad) {
//        groups[nextGroup.group] = groups[nextGroup.group] || {};
//        const group = groups[nextGroup.group];
//
//        // Temporary object to hold the results by ID
//        const tempGroup = {};
//
//        // Process each property type
//        for (let prop of loadableProps) {
//            const content = await loadFile(nextGroup[prop]);
//            for (let [id, value] of Object.entries(content)) {
//                tempGroup[id] = tempGroup[id] || {};
//                tempGroup[id][`${prop}_en`] = value.en;
//            }
//        }
//
//        // Now transform tempGroup by replacing IDs with name_en and adding category
//        for (let [id, values] of Object.entries(tempGroup)) {
//            const nameKey = values.name_en; // Get name_en to use as the new key
//            if (nameKey) {
//                group[nameKey] = values; // Assign all props
//                delete group[nameKey].name_en; // Remove name_en
//                group[nameKey].category = nextGroup.group; // Add category
//            }
//        }
//    }
//    return groups;
//};

const loadFileGroups = async toLoad => {
    const loadableProps = ["name", "info", "caption", "effect", "dialog"];
    const groups = {};
    for (let nextGroup of toLoad) {
        groups[nextGroup.group] = groups[nextGroup.group] || {};
        const group = groups[nextGroup.group];

        for (let prop of loadableProps) {
            const content = await loadFile(nextGroup[prop]);
            for (let [id, value] of Object.entries(content)) {
                group[id] = group[id] || {};
                group[id][`${prop}_en`] = value.en;
            }
        }
    }
    return groups;
}

// annotate NPCs with npcIds and types by parsing the id
const groups = await loadFileGroups(fileGroups);
for (let [id, npc] of Object.entries(groups.npcs)) {
    // NPC ids have three forms:
    // 903251600 -> starts with 9, its a boss
    // 10104137 -> starts with 10, its "Someone Yet Unseen"
    // 135500 -> [1][2550][0] 1 = NPC. 2550 = NPC ID. 0 = npc varient. Eg "Okina" and "Bloody Finger Okina"
    //              bosses may also have varient IDs, but I haven't bothered to look


    let idStr = id.toString();
    if (idStr.startsWith("10")) {
        npc.type = "unmet";
        continue;
    }
    if (idStr.startsWith("9")) {
        npc.type = "boss";
        npc.id = idStr;
        continue;
    }
    npc.type = "npc";
    npc.form = idStr.slice(-1);
    npc.id = idStr.slice(1, -2);
    id.toString().slice()
}

// annotate dialogs with sections/dialogs/npcs
for(let [lineId, line] of Object.entries(groups.dialog)) {
    const idStr = lineId.toString();
    if (idStr.length < 8) {
        // there's a handful of cut dialogs that have broken dialog ids
        line.npc = "Narator";
        line.npcId = "0";
        line.sectionId = "0";
        line.dialogId = "0";
        continue;
    }

    
    line.npcId = (["200", "201", "202", "203", "204" ].some(e => idStr.startsWith(e))) ? idStr.slice(0, 4) : idStr.slice(0, 3); // 204 space is boss fight dialog, and we need to know the full id
    line.sectionId = idStr.slice(4, 7);
    line.dialogId = idStr.slice(0, 7);
    line.sectionId = idStr.slice(7);

    
    // some dialog npc ids point to the wrong NPCs. Eg - the opening spearch is attributed to
    // master lucet. All Ranni/Rennala and Malania's boss fight dialog is attributed to non-existant NPCs
    // the mapping is pretty obvious, though, so do some simple fixup here
    const npcFixupIds = {
        "110": "0", // Narator/unknown
        "120": "0", // Narator/unknown
        "130": "0", // Narator/unknown
        "140": "0", // Narator/unknown
        "150": "0", // Narator/unknown
        "160": "0", // Narator/unknown
        "165": "0", // Narator/unknown
        "2025": "106", // Ranni
        "1062": "106", // Ranni
        "1063": "106", // Ranni
        "2049": "106", // Ranni
        "1060": "106", // Ranni
        "2039": "902120000", // Malenia
        "2026": "902120000", // Malenia
        "2027": "902120000", // Malenia
        "2028": "902110001", // Maliketh
        "2023": "902110001", // Maliketh
        "2020": "202", // Gurranq
        "2030": "904710001", // Rykard
        "2149": "904710001", // Rykard
        "214": "904710001", // Rykard
        "2040": "902130000", // Margit
        "2003": "902130000", // Margit
        "2004": "904750000", // Godrick
        "2005": "904750000", // Godrick
        "7300": "904750000", // Godrick
        "207": "904750000", // Godrick
        "208": "904750000", // Godrick
        "2004": "904750000", // Godrick
        "2007": "904720002", // Godfrey
        "2008": "904720002", // Godfrey
        "206": "904720002", // Godfrey
        "2007": "904720002", // Godfrey
        "2008": "904720002", // Godfrey
        "2010": "902030000", // Rennala (technically, the culvers)
        "2024": "200", // Rennala 
        "2000": "200", // Rennala 
        "2014": "904800000", // Mohg
        "209": "904800000", // Mohg
        "2021": "902130002", // Morgott
        "2043": "100", // Melina
        "2001": "100", // Melina
        "1001": "100", // Melina
        "205": "100", // Melina
        "2001": "100", // Melina
        "2201": "220", // Alexander (when stuck in a hole)
        "2208 ": "220", // Alexander
        "2131": "213", // Hewg
        "1011": "102", // Enia
        "1009": "750", // finger reader (I'm not sorting out which one is which)
        "101": "750", // finger reader
        "8008": "801", // nomadic merchant
        "8001": "801", // nomadic merchant
        "7050": "301", // Varre
        "3071": "307", // Seluvis
        "3078": "307", // Seluvis
        "3072": "217", // Pidia
        "3108": "217", // Pidia
    }
    if (npcFixupIds[line.npcId]) line.npcId = npcFixupIds[line.npcId];

    // The melina dialog below "060" are wrongly attributed to melina
    if (line.npcId === "1000" && line.dialogId.slice(4, 7).startsWith("0")) {
        line.npcId = "0";
        line.sectionId = "0";
        line.dialogId = "0";
    }

    const npcs = Object.entries(groups.npcs).filter(([id, npc]) => npc.id === line.npcId);
    if (npcs.length > 0) line.npc = npcs[0][1].name_en;
    
    if (!line.npc && line.npcId.startsWith("9")) {
        line.npc = "Stage Directions";
        line.npcId = "9";
    }
    if (!line.npc && line.npcId.startsWith("2045")) {
        line.npc = "Stage Directions";
        line.npcId = "2045";
    }
    if (!line.npc && line.npcId.startsWith("337")) {
        line.npc = "Omenhunter Shanehaight (cut npc)";
        line.npcId = "337";
    }
    if (!line.npc && line.npcId.startsWith("7")) {
        line.npc = "Ghost";
        line.npcId = "7";
    }
    if (!line.npc && line.npcId.startsWith("303")) {
        line.npc = "Guilbert the Redeemer (cut npc)";
        line.npcId = "303";
    }
    if (!line.npc && line.npcId.startsWith("227")) {
        line.npc = "Aurelia's Sister";
        line.npcId = "227";
    }
    if (!line.npc && line.npcId.startsWith("332")) {
        line.npc = "Knight of Rykard";
        line.npcId = "332";
    }
    if (!line.npc && line.npcId.startsWith("2048")) {
        line.npc = "End of Game Dialog + Extra Morgott";
        line.npcId = "2048";
    }
    if (!line.npc && line.npcId == "0") line.npc = "Narator";
}

let packedDialog = {};
for (let line of Object.values(groups.dialog)) {
    packedDialog[line.dialogId] = packedDialog[line.dialogId] || { 
        name_en: (line.npc ? line.npc : "Unknown NPC " + line.npcId) + " dialog",
        id: line.npcId,
        sections: []
    };
    packedDialog[line.dialogId].sections.push(line);
}


for (let dialog of Object.values(packedDialog)) {
    dialog.info_en = "";
    const sortedSections = Object.values(dialog.sections.sort((a, b) => a.sectionId.localeCompare(b.sectionId)));
    for (let section of sortedSections) {
        if (section.info_en) dialog.info_en += " " + section.info_en ?? "<br/>";
    }
    delete dialog.sections;
}

groups.dialog = Object.entries(packedDialog).reduce((acc, [id, dialog]) => {
    dialog.lineId = id;
    if (!acc[dialog.id]) {
        acc[dialog.id] = [dialog];
    } else {
        acc[dialog.id].push(dialog);
    }
    return acc;
}, {});

groups.dialog = Object.fromEntries(Object.entries(groups.dialog).map(([k, val]) => {
    const sorted = val.sort((a, b) => a.lineId.localeCompare(b.lineId));
    const en = sorted.map(i => `[${i.lineId}] ${i.info_en}`).join(`<br/><br/>`);

    return [k, {
        name_en: val[0].name_en,
        id: k,
        info_en: en,
    }];
}));

// packedDialog = Object.fromEntries(Object.entries(packedDialog).filter(([id, val]) => val.info_en.trim() !== ""));


await fs.writeFile('elden_ring_text.json', JSON.stringify(groups, null, 4));



