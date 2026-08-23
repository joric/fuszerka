function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim().replace(/\(Clone\)/g, '').trim();
    let m, n;

    if (/^\(Part_Decoration\)_CustomLicensePlate(?:_|$)/.test(str)) return 'PartName_CustomLicensePlate_01_0';
    if (str.startsWith('(Part_Decoration)_')) {
        n = str.slice('(Part_Decoration)_'.length).replace(/(?:_\d+)+$/, '');
        return `PartName_Decoration_${n}`;
    }
    if (str.startsWith('(NoShop_Part_Decoration)_')) {
        n = str.slice('(NoShop_Part_Decoration)_'.length).replace(/(?:_\d+)+$/, '');
        return `PartName_${n}`;
    }

    if (str.startsWith('(Grabbable_Collectable_Prop)_Mushroom')) return 'intEnv_Mushroom';
    if (/^\(Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_BeerCrate(?:_|$)/.test(str)) return 'FluidName_Beer';
    if (/^\(Grabbable_Collectable_Prop\)_FireWood(?:_|$)/.test(str)) return 'ShopItem_WoodLog_Name';
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_Animal_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (/^\(Grabbable_Prop\)_Plaid(?:_|$)/.test(str)) return 'PSI_FloorCover';
    if (/^\(Grabbable_Prop\)_Barrier(?:_|$)/.test(str)) return 'ShopItem_MetalFence_Name';
    if (/^\(Grabbable_Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_QuestPlank(?:_|$)/.test(str)) return 'IntEnv_WoodenPlank';
    if (/^\(Grabbable_Prop\)_Crate(?:_|$)/.test(str)) return 'IntEnv_WoodenCrate';
    if (m = str.match(/^\(Grabbable_Prop\)_DEMOUTABLE_([^_]+)/)) return `ShopItem_${m[1]}_Name`;
    if (m = str.match(/^\(Grabbable_Prop\)_(.+)$/)) {
        n = m[1].replace(/(?:_\d+)+$/, '');
        if (n === 'PlankPanel') return 'IntEnv_WoodenPanel';
        if (n === 'Cardboard_Box') return 'IntEnv_CardboardBox';
        return `ShopItem_${n}_Name`;
    }

    if (m = str.match(/^\(Grabbable_Tool\)__+(.+?)(?:_\d+)?$/)) {
        n = m[1].trim().replace(/\s+/g, '');
        if (n === 'GrinderDisc') return 'ToolName_GrindingDisc';
        return `ToolName_${n}`;
    }

    if (/^\(Interactable_Readable_Prop\)_AB_\d+_DrinkingBeer$/.test(str)) return 'FluidName_Beer';
    if (m = str.match(/^\(Interactable_Readable_Prop\)_AB_\d+_.*Recipe$/)) return 'IntEnv_Recipe';
    if (m = str.match(/^\(Interactable_Diggable_Prop\)_PlantingPile_Treasure(?:_\d+)?$/)) return 'FluidName_BadProduct';
    if (m = str.match(/^\(Interactable_Diggable_Prop\)_PlantingPile_Empty(?:_\d+)?$/)) return 'IntEnv_DirtPile';
    if (/^\(Interactable_Prop\)_Coin_Pickable(?:_\d+)?$/.test(str)) return 'IntEnv_Coin_1PolishZloty';
    if (m = str.match(/^\(Interactable_Prop\)_+([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Interactable\)\s+(.+)/)) return `IntEnv_${m[1].trim().replace(/\s+/g, '')}`;

    if (m = str.match(/^\(Tool\)\s+Paint Spray\s*-\s*(.+)$/)) {
        n = m[1].trim().replace(/\s+/g, '');
        return /_\d+$/.test(n) ? `PaintColor_${n.replace(/_\d+$/, '')}` : `SprayName_${n}`;
    }
    if (m = str.match(/^\(Tool\)_?(.+?)(?:_\d+)?$/)) return `ToolName_${m[1].trim().replace(/\s+/g, '')}`;

    if (m = str.match(/^\(Fluid\)\s+(.+)$/)) {
        n = m[1].trim();
        if (/^Vodka(?:_\d+)?$/i.test(n)) return 'ProductName_Vodka_1';
        if (/^.+\s+Bottle(?:_\d+)?$/i.test(n)) return `FluidName_${n.replace(/\s+Bottle(?:_\d+)?$/i, '').replace(/\s+/g, '')}`;
        return `FluidName_${n.replace(/_\d+$/, '').replace(/\s+/g, '')}`;
    }

    if (m = str.match(/^\(Part\)\s+(.+?)\s*-\s*(.+)$/)) {
        const prefix = m[1].trim().replace(/\s+/g, '');
        n = m[2].trim().replace(/(?:_\d+)+$/, '').replace(/\s+/g, '');
        if (prefix === 'UrsusC355') {
            if (n === 'SmallTire') n = 'FrontTire';
            if (n === 'BigTire') n = 'RearTire';
        }
        return `PartName_${prefix}_${n}`;
    }
    if (str.startsWith('(Part)_')) return `PartName_${str.slice(7).replace(/(?:_\d+)+$/, '')}`;
    if (m = str.match(/^\(Part\)\s+(.+)$/)) return `PartName_${m[1].trim().replace(/(?:_\d+)+$/, '').replace(/\s+/g, '')}`;

    if (/\bTire\b/i.test(str)) return 'PSI_Tire';

    return str;
}

function getTitle(p) {
    const k = getKey(p.name);
    const keys = [k];

    if (k.startsWith('PartName_')) {
        const name = k.slice('PartName_'.length);
        const variants = [name, name.replace(/TimingGearCover$/, 'TimingChainCover'), name.replace(/TimingGear$/, 'TimingGearBig'), name.replace(/^Battery$/, 'CarBattery')];
        for (const variant of variants) {
            keys.push(`PartName_${variant}`);
            keys.push(`PartName_Polonez_${variant}`);
            keys.push(`PartName_Fiat126p_${variant}`);
        }
    }

    for (const key of keys) {
        for (const postfix of ['', '_2', '_01', '_02', '_03', '_04', '_R']) {
            const value = lang[key + postfix];
            if (value) return value;
        }
    }

    return p.name;
}
