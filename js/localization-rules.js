function getKey(input) {
    if (!input || typeof input !== 'string') return '';
    const str = input.trim();
    let m;

    if (m = /^\(Grabbable_Collectable_Prop\)_Animal_([^_]+)/.exec(str))
        return `IntEnv_${m[1]}`;

    if (m = /^\(Grabbable_Collectable_Prop\)_([^_]+)/.exec(str))
        return `IntEnv_${m[1]}`;

    if (m = /^\(Grabbable_Prop\)_DEMOUTABLE_([^_]+)/.exec(str))
        return `ShopItem_${m[1]}_Name`;

    if (m = /^\(Grabbable_Prop\)_([^_]+)(?:_\d+)?/.exec(str))
        return `ShopItem_${m[1]}_Name`;

    if (m = /^\(Interactable_Prop\)__([^_]+)(?:_.*)?$/.exec(str))
        return `IntEnv_${m[1]}`;

    if (m = /^\(Interactable\)\s+(.+)/.exec(str))
        return `IntEnv_${m[1].trim().replace(/\s+/g, '')}`;

    if (m = /^\(Part\)\s+([^-]+?)\s*-\s*([^_]+?)(?:_\d+)?$/.exec(str)) {
        const name = m[1].trim().replace(/\s+/g, '');
        const desc = m[2].trim().replace(/\s+/g, '');
        return /[A-Z]\d+/.test(name) && !/\d/.test(desc) ? `PSI_${name}_${desc}` : `PartName_${name}_${desc}`;
    }

    if (str.startsWith('(Part)_')) {
        const name = str.slice(7).replace(/-/g, '_').replace(/\(\w+\)$/, '');
        return `PartName_${name.replace(/_\d+$/, '')}`;
    }

    if (m = /^\(Part\)\s+([^_(]+)(?:_(\d+))?(?:\(Clone\))?$/.exec(str))
        return `PartName_${m[1]}${m[2] ? `_${m[2]}` : ''}`;

    if (str.startsWith('(Part) '))
        return `PartName_${str.slice(7).replace(/\(Clone\)$/, '')}`;

    return str;
}

function getTitle(p) {
    const k = getKey(p.name);
    for (const s of ['', '_2', '_01', '_02', '_03', '_04'])
        if (lang[k + s]) return lang[k + s];
    return p.name;
}