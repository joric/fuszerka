function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim().replace(/\(Clone\)/g, '').trim();
    let m;

    if (str.startsWith('(Grabbable_Collectable_Prop)_Mushroom')) return 'intEnv_Mushroom';
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_Animal_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Grabbable_Collectable_Prop\)_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Grabbable_Prop\)_DEMOUTABLE_([^_]+)/)) return `ShopItem_${m[1]}_Name`;
    if (m = str.match(/^\(Grabbable_Prop\)_([^_]+)/)) return `ShopItem_${m[1]}_Name`;
    if (/^\(Interactable_Readable_Prop\)_AB_\d+_.*Recipe$/.test(str)) return 'IntEnv_Recipe';
    if (m = str.match(/^\(Interactable_Prop\)_([^_]+)/)) return `IntEnv_${m[1]}`;
    if (m = str.match(/^\(Interactable\)\s+(.+)/)) return `IntEnv_${m[1].trim().replace(/\s+/g, '')}`;
    if (m = str.match(/^\(Tool\)\s+Paint Spray\s*-\s*(.+)$/)) {
        const name = m[1].trim().replace(/\s+/g, '');
        return /_\d+$/.test(name) ? `PaintColor_${name.replace(/_\d+$/, '')}` : `SprayName_${name}`;
    }
    if (m = str.match(/^\(Tool\)_?(.+?)(?:_\d+)?$/)) return `ToolName_${m[1].trim().replace(/\s+/g, '')}`;
    if (m = str.match(/^\(Fluid\)\s+(.+?)(?:_\d+)?$/)) return `FluidName_${m[1].replace(/\s+/g, '')}`;

    if (str.startsWith('(Part)_')) {
        const name = str.slice(7).replace(/_\d+$/, '').replace(/[-_]/g, '');
        return `PartName_${name}`;
    }

    if (/^\(Part\)\s+TimingGearCover_\d+$/.test(str)) return 'PSI_TimingChainCover';
    if (/^\(Part\)\s+TimingGear_\d+$/.test(str)) return 'PSI_TimingGearBig';
    if (m = str.match(/^\(Part\)\s+(Axle|BrakeDrum)_\d+$/)) return `PartName_${m[1]}`;
    if (m = str.match(/^\(Part\)\s+(Muffler)_\d+$/)) return `PartName_${m[1]}`;

    if (m = str.match(/^\(Part\)\s+([^-]+?)\s*-\s*(.+)$/)) {
        const name = m[1].trim().replace(/\s+/g, '');
        const desc = m[2].trim().replace(/\s+/g, '');
        if (/^[A-Z]\d+$/.test(name) && !/\d/.test(desc)) return `PSI_${name}_${desc}`;
        return `PartName_${name}_${desc}`;
    }

    if (m = str.match(/^\(Part\)\s+([^_]+)_\d+$/)) return `PartName_${m[1]}`;
    if (m = str.match(/^\(Part\)\s+([^_]+)$/)) return `PartName_${m[1]}`;
    if (str.startsWith('(Part) ')) return `PartName_${str.slice(7).replace(/\s+/g, '')}`;

    return str;
}

function getTitle(p) {
    const k = getKey(p.name);
    const keys = [k];

    if (k.startsWith('PartName_')) {
        const name = k.slice('PartName_'.length);
        keys.push(`PSI_${name}`, `PartName_Polonez_${name}`, `PartName_Fiat126p_${name}`);
    }

    for (const key of keys) {
        for (const postfix of ['', '_2', '_01', '_02', '_03', '_04']) {
            const value = lang[key + postfix];
            if (value) return value;
        }
    }

    return p.name;
}
