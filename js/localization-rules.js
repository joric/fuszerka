function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim().replace(/\(Clone\)/g, '').trim();
    let m, n;
    const stripNum = s => s.replace(/(?:_\d+)+$/, '');
    const clean = s => s.trim().replace(/\s+/g, '');

    if (/^MainMapBorder_ALL(?:_\d+)?$/.test(str)) return 'Interaction_Closed';

    if (/^\(Interactable_Prop\)__Door_Base(?:_\d+)?$/.test(str)) return 'IntEnv_Door';

    if (/^\(Part_Decoration\)_CustomLicensePlate(?:_|$)/.test(str)) return 'PartName_CustomLicensePlate_01_0';
    if (str.startsWith('(Part_Decoration)_')) {
        n = stripNum(str.slice('(Part_Decoration)_'.length));
        return `PartName_${n}`;
    }
    if (str.startsWith('(NoShop_Part_Decoration)_')) {
        n = stripNum(str.slice('(NoShop_Part_Decoration)_'.length));
        return `PartName_${n}`;
    }

    if (/^\(Grabbable_Collectable_Prop\)_Mushroom(?:_|$)/.test(str)) return 'intEnv_Mushroom';
    if (/^\(Grabbable_Collectable_Prop\)_FireWood(?:_|$)/.test(str)) return 'ShopItem_WoodLog_Name';
    if (/^\(Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';

    if (/^\(Grabbable_Prop\)_PlankPanel(?:_|$)/.test(str)) return 'IntEnv_WoodenPanel';
    if (/^\(Grabbable_Prop\)_Cardboard_Box(?:_|$)/.test(str)) return 'IntEnv_CardboardBox';
    if (/^\(Grabbable_Prop\)_BeerCrate(?:_|$)/.test(str)) return 'FluidName_Beer';
    if (/^\(Grabbable_Prop\)_Taburet(?:_|$)/.test(str)) return 'PSI_Seat';
    if (/^\(Grabbable_Prop\)_Plaid(?:_|$)/.test(str)) return 'PSI_FloorCover';
    if (/^\(Grabbable_Prop\)_(?:Barrier|HayBalesRail)(?:_|$)/.test(str)) return 'ShopItem_MetalFence_Name';
    if (/^\(Grabbable_Prop\)_Brick(?:_|$)/.test(str)) return 'IntEnv_Brick';
    if (/^\(Grabbable_Prop\)_QuestPlank(?:_|$)/.test(str)) return 'IntEnv_WoodenPlank';
    if (/^\(Grabbable_Prop\)_Crate(?:_|$)/.test(str)) return 'IntEnv_WoodenCrate';

    if (/^\(Grabbable_Prop\)_DEMOUTABLE_MetalFence(?:_|$)/.test(str)) return 'ShopItem_MetalFence_Name';
    if (m = str.match(/^\(Grabbable_Prop\)_DEMOUTABLE_(.+)$/)) return `ShopItem_${stripNum(m[1])}_Name`;

    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_Animal_(.+)$/)) return `IntEnv_${stripNum(m[1])}`;
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_(.+)$/)) return `IntEnv_${stripNum(m[1])}`;

    if (m = str.match(/^\(Grabbable_Tool\)__+(.+)$/)) {
        n = stripNum(m[1]);
        if (n === 'GrinderDisc') return 'ToolName_GrindingDisc';
        return `ToolName_${clean(n)}`;
    }

    if (/^\(Interactable_Readable_Prop\)_AB_\d+_MissingCow(?:_\d+)?$/.test(str)) return 'IntEnv_Announcement';
    if (/^\(Interactable_Readable_Prop\)_AB_\d+_DrinkingBeer(?:_\d+)?$/.test(str)) return 'FluidName_Beer';
    if (/^\(Interactable_Diggable_Prop\)_PlantingPile_Treasure(?:_\d+)?$/.test(str)) return 'FluidName_BadProduct';
    if (/^\(Interactable_Diggable_Prop\)_PlantingPile_Empty(?:_\d+)?$/.test(str)) return 'IntEnv_DirtPile';
    if (/^\(Interactable_Prop\)_Coin_Pickable(?:_\d+)?$/.test(str)) return 'IntEnv_Coin_1PolishZloty';

    if (m = str.match(/^\(Interactable_Readable_Prop\)_AB_\d+_(.+)$/)) {
        n = stripNum(m[1]);
        if (/DrinkingBeer/i.test(n)) return 'FluidName_Beer';
        if (/MissingCow/i.test(n)) return 'IntEnv_Announcement';
        if (/Recipe/i.test(n)) return 'IntEnv_Recipe';
    }

    if (m = str.match(/^\(Interactable_Prop\)_+(.+)$/)) return `IntEnv_${stripNum(m[1])}`;
    if (m = str.match(/^\(Interactable\)\s+(.+)$/)) return `IntEnv_${clean(stripNum(m[1]))}`;

    if (m = str.match(/^\(Tool\)\s+Paint Spray\s*-\s*(.+)$/)) return `SprayName_${clean(stripNum(m[1]))}`;
    if (m = str.match(/^\(Tool\)_?(.+)$/)) return `ToolName_${clean(stripNum(m[1]))}`;

    if (m = str.match(/^\(Fluid\)\s+(.+)$/)) {
        n = m[1].trim();
        if (/^Vodka(?:_\d+)?$/i.test(n)) return 'ProductName_Vodka_1';
        if (/^Beer\s+Bottle(?:_\d+)?$/i.test(n)) return 'FluidName_Beer';
        if (/^Wine(?:_\d+)?$/i.test(n)) return 'FluidName_Wine';
        return `FluidName_${clean(stripNum(n))}`;
    }

    if (str.startsWith('(Part)')) {
        n = str.slice(6).trim();
        if (n.startsWith('_')) n = n.slice(1);

        const i = n.indexOf(' - ');
        if (i >= 0) {
            const prefix = clean(n.slice(0, i));
            let name = stripNum(n.slice(i + 3).trim());

            if (prefix === 'UrsusC355' && /^Small\s+Tire$/i.test(name)) name = 'FrontTire';
            else if (prefix === 'UrsusC355' && /^Big\s+Tire$/i.test(name)) name = 'RearTire';
            else if (prefix === 'Zuk' && /^Air\s+Filter\s+Housing$/i.test(name)) name = 'AirFilter_Housing';
            else if (prefix === 'Fiat126p' && /^Bumper\s+Rear$/i.test(name)) name = 'RearBumper';
            else name = clean(name);

            return `PartName_${prefix}_${name}`;
        }

        n = stripNum(n);
        if (n === 'AirFilterHousing') return 'PartName_Zuk_AirFilter_Housing';
        if (n === 'CarStarter') return 'PSI_Starter';
        return `PartName_${clean(n).replace(/^_+/, '')}`;
    }

    if (/\bTire\b/i.test(str)) return 'PSI_Tire';
    return str;
}

function getTitle(p) {
    const k = getKey(p.name);
    if (!k) return p.name;

    const keys = [k];

    if (k.startsWith('PartName_')) {
        const name = k.slice('PartName_'.length);
        if (name === 'Battery') keys.push('PartName_CarBattery');
        if (name === 'TimingGear') keys.push('PartName_Fiat126p_TimingGearBig');
        if (name === 'TimingGearCover') keys.push('PartName_Fiat126p_TimingChainCover');
    }

    for (const key of keys) {
        if (lang[key]) return lang[key];
        for (const postfix of ['_2', '_01', '_02', '_03', '_04', '_R']) {
            if (lang[key + postfix]) return lang[key + postfix];
        }
    }

    return '';
}
