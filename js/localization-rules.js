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
    if (str.startsWith('(Part)_')) return `PartName_${str.slice(7).replace(/_\d+$/, '')}`;
    if (m = str.match(/^\(Part\)\s+([^-]+?)\s*-\s*(.+)$/)) {
        const name = m[1].trim().replace(/\s+/g, '');
        const desc = m[2].trim().replace(/\s+/g, '');
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
        const variants = [
            name,
            name.replace(/TimingGearCover$/, 'TimingChainCover'),
            name.replace(/TimingGear$/, 'TimingGearBig'),
            name.replace(/^Battery$/, 'CarBattery')
        ];
        for (const variant of variants) {
            keys.push(`PartName_${variant}`, `PSI_${variant}`, `PartName_Polonez_${variant}`, `PartName_Fiat126p_${variant}`);
        }
    }

    for (const key of keys)
        for (const postfix of ['', '_2', '_01', '_02', '_03', '_04', '_R']) {
            const value = lang[key + postfix];
            if (value) return value;
        }

    return p.name;
}
