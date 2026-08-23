function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim().replace(/\(Clone\)/g, '').trim();
    let m;

    if (str.startsWith('(Grabbable_Collectable_Prop)_Mushroom')) return 'intEnv_Mushroom';
    if (/^\(Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_BeerCrate(?:_|$)/.test(str)) return 'FluidName_Beer';
    if (/^\(Grabbable_Collectable_Prop\)_FireWood(?:_|$)/.test(str)) return 'ShopItem_WoodLog_Name';
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_Animal_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (/^\(Grabbable_Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_QuestPlank(?:_|$)/.test(str)) return 'IntEnv_WoodenPlank';
    if (m = str.match(/^\(Grabbable_Prop\)_DEMOUTABLE_([^_]+)/)) return `ShopItem_${m[1]}_Name`;
    if (m = str.match(/^\(Grabbable_Prop\)_(.+)$/)) {
        const name = m[1].replace(/(?:_\d+)+$/, '');
        if (name === 'PlankPanel') return 'IntEnv_WoodenPanel';
        if (name === 'Cardboard_Box') return 'IntEnv_CardboardBox';
        return `ShopItem_${name}_Name`;
    }

    if (m = str.match(/^\(Grabbable_Tool\)__+(.+?)(?:_\d+)?$/)) {
        const name = m[1].trim().replace(/\s+/g, '');
        if (name === 'GrinderDisc') return 'ToolName_GrindingDisc';
        return `ToolName_${name}`;
    }

    if (/^\(Interactable_Readable_Prop\)_AB_\d+_DrinkingBeer$/.test(str)) return 'FluidName_Beer';
    if (m = str.match(/^\(Interactable_Readable_Prop\)_AB_\d+_.*Recipe$/)) return 'IntEnv_Recipe';
    if (m = str.match(/^\(Interactable_Diggable_Prop\)_PlantingPile_Treasure(?:_\d+)?$/)) return 'FluidName_BadProduct';
    if (m = str.match(/^\(Interactable_Diggable_Prop\)_PlantingPile_Empty(?:_\d+)?$/)) return 'IntEnv_DirtPile';
    if (m = str.match(/^\(Interactable_Prop\)_+([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Interactable\)\s+(.+)/)) return `IntEnv_${m[1].trim().replace(/\s+/g, '')}`;

    if (m = str.match(/^\(Tool\)\s+Paint Spray\s*-\s*(.+)$/)) {
        const name = m[1].trim().replace(/\s+/g, '');
        return /_\d+$/.test(name) ? `PaintColor_${name.replace(/_\d+$/, '')}` : `SprayName_${name}`;
    }
    if (m = str.match(/^\(Tool\)_?(.+?)(?:_\d+)?$/)) return `ToolName_${m[1].trim().replace(/\s+/g, '')}`;

    if (m = str.match(/^\(Fluid\)\s+(.+)$/)) {
        const name = m[1].trim();
        if (/^Vodka(?:_\d+)?$/i.test(name)) return 'ProductName_Vodka_1';
        if (/^.+\s+Bottle(?:_\d+)?$/i.test(name)) return `FluidName_${name.replace(/\s+Bottle(?:_\d+)?$/i, '').replace(/\s+/g, '')}`;
        return `FluidName_${name.replace(/_\d+$/, '').replace(/\s+/g, '')}`;
    }

    if (m = str.match(/^\((?:NoShop_Part_Decoration|Part_Decoration)\)_(.+)$/)) return `PartName_${m[1].replace(/_\d+$/, '')}`;
    if (m = str.match(/^\((?:NoShop_Part_Decoration|Part_Decoration)\)\s+(.+)$/)) return `PartName_${m[1].replace(/_\d+$/, '')}`;

    if (m = str.match(/^\(Part\)\s+(.+?)\s*-\s*(.+)$/)) {
        const prefix = m[1].trim().replace(/\s+/g, '');
        let name = m[2].trim().replace(/_\d+$/, '').replace(/\s+/g, '');
        if (prefix === 'UrsusC355') {
            if (name === 'SmallTire') name = 'FrontTire';
            if (name === 'BigTire') name = 'RearTire';
        }
        return `PartName_${prefix}_${name}`;
    }
    if (str.startsWith('(Part)_')) return `PartName_${str.slice(7).replace(/_\d+$/, '')}`;
    if (m = str.match(/^\(Part\)\s+(.+)$/)) return `PartName_${m[1].trim().replace(/_\d+$/, '').replace(/\s+/g, '')}`;

    if (/\bTire\b/i.test(str)) return 'PSI_Tire';

    return str;
}

function getTitle(p) {
    const k = getKey(p.name);
    const keys = [k];

    if (k.startsWith('PartName_')) {
        const name = k.slice('PartName_'.length);
        const variants = [
            name,
            name.replace(/TimingGearCover$/, 'TimingChainCover'),
            name.replace(/TimingGear$/, 'TimingGearBig'),
            name.replace(/^Battery$/, 'CarBattery')
        ];
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
