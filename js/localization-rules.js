function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim().replace(/\(Clone\)/g, '').trim();
    let m, n;

    if (/^\(Part_Decoration\)_CustomLicensePlate(?:_|$)/.test(str)) return 'PartName_CustomLicensePlate_01_0';
    if (str.startsWith('(Part_Decoration)_')) {
        n = str.slice('(Part_Decoration)_'.length).replace(/(?:_\d+)+$/, '');
        return `PartName_${n}`;
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
    if (/^\(Grabbable_Prop\)_Plaid(?:_\d+)?$/.test(str)) return 'PSI_FloorCover';
    if (/^\(Grabbable_Prop\)_(?:Barrier|HayBalesRail)(?:_\d+)?$/.test(str)) return 'ShopItem_MetalFence_Name';
    if (/^\(Grabbable_Prop\)_Brick(?:_\d+)?$/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_QuestPlank(?:_\d+)?$/.test(str)) return 'IntEnv_WoodenPlank';
    if (/^\(Grabbable_Prop\)_Crate(?:_\d+)?$/.test(str)) return 'IntEnv_WoodenCrate';
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

    if (/^\(Interactable_Readable_Prop\)_AB_\d+_MissingCow(?:_\d+)?$/.test(str)) return 'IntEnv_Announcement';
    if (/^\(Interactable_Readable_Prop\)_AB_\d+_DrinkingBeer$/.test(str)) return 'FluidName_Beer';
    if (m = str.match(/^\(Interactable_Readable_Prop\)_AB_\d+_.*Recipe$/)) return 'IntEnv_Recipe';
    if (/^\(Interactable_Diggable_Prop\)_PlantingPile_Treasure(?:_\d+)?$/.test(str)) return 'FluidName_BadProduct';
    if (/^\(Interactable_Diggable_Prop\)_PlantingPile_Empty(?:_\d+)?$/.test(str)) return 'IntEnv_DirtPile';
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

    if (str.startsWith('(Part)')) {
        n = str.slice(6).trim();
        if (n.startsWith('_')) n = n.slice(1);
        const i = n.indexOf(' - ');
        if (i >= 0) {
            const prefix = n.slice(0, i).trim().replace(/\s+/g, '');
            let name = n.slice(i + 3).trim().replace(/(?:_\d+)+$/, '');
            if (prefix === 'UrsusC355' && /^Small\s+Tire$/i.test(name)) name = 'FrontTire';
            else if (prefix === 'UrsusC355' && /^Big\s+Tire$/i.test(name)) name = 'RearTire';
            else if (prefix === 'Zuk' && /^Air\s+Filter\s+Housing$/i.test(name)) name = 'AirFilter_Housing';
            else if (prefix === 'Fiat126p' && /^Bumper\s+Rear$/i.test(name)) name = 'RearBumper';
            else name = name.replace(/\s+/g, '');
            return `PartName_${prefix}_${name}`;
        }
        n = n.replace(/(?:_\d+)+$/, '');
        if (n === 'AirFilterHousing') return 'PartName_Zuk_AirFilter_Housing';
        return `PartName_${n.replace(/\s+/g, '_')}`;
    }

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
