var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var roots = scene.GetRootGameObjects();

var output = @"C:\Temp\markers.json";
var progress = @"C:\Temp\markers.progress";

var REQUIRED_COMPONENTS = new[] { "ES3AutoSave", "Outlinable" };
var NAME_FILTERS = new[] { "MainMapBorder" };

var EXPORT_ACTIVE = false;
var EXPORT_SCENE = false;
var EXPORT_COMPONENTS = false;
var EXPORT_ES3 = false;

// outputKey -> (alias names to try, optional component-type filter)
var ALLOWED_FIELDS = new System.Collections.Generic.Dictionary<string, System.Tuple<string[], string[]>> {
    { "m_ItemName", System.Tuple.Create(new[] { "m_ItemName", "Name" }, new[] { "ItemIdentifier" }) },
    { "m_PaintColor", System.Tuple.Create(new[] { "m_PaintColor" }, (string[])null) },
    { "m_SprayName", System.Tuple.Create(new[] { "m_SprayName" }, (string[])null) },
    { "m_PartName", System.Tuple.Create(new[] { "m_PartName" }, (string[])null) },
    { "m_Amount", System.Tuple.Create(new[] { "m_Amount", "Amount" }, (string[])null) },
    { "m_Capacity", System.Tuple.Create(new[] { "m_Capacity", "Capacity" }, (string[])null) },
    { "m_Content", System.Tuple.Create(new[] { "m_Content" }, (string[])null) },
};

var MAX_DEPTH = 4;
var flags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;

var findField = new System.Func<object, string, System.Reflection.FieldInfo>((o, n) => {
    if (o == null) return null;
    var t = o.GetType();
    while (t != null) {
        var f = t.GetField(n, flags);
        if (f != null) return f;
        t = t.BaseType;
    }
    return null;
});

var getField = new System.Func<object, string, object>((o, n) => {
    var f = findField(o, n);
    if (f == null) return null;
    try { return f.GetValue(o); } catch { return null; }
});

var findProp = new System.Func<object, string, System.Reflection.PropertyInfo>((o, n) => {
    if (o == null) return null;
    var t = o.GetType();
    while (t != null) {
        var p = t.GetProperty(n, flags);
        if (p != null && p.GetIndexParameters().Length == 0) return p;
        t = t.BaseType;
    }
    return null;
});

var getProp = new System.Func<object, string, object>((o, n) => {
    var p = findProp(o, n);
    if (p == null) return null;
    try { return p.GetValue(o, null); } catch { return null; }
});

var isLeaf = new System.Func<System.Type, bool>((t) => {
    if (t == null) return true;
    if (t.IsPrimitive || t.IsEnum) return true;
    if (t == typeof(string) || t == typeof(decimal)) return true;
    if (t == typeof(UnityEngine.Color) || t == typeof(UnityEngine.Vector2) ||
        t == typeof(UnityEngine.Vector3) || t == typeof(UnityEngine.Vector4) ||
        t == typeof(UnityEngine.Quaternion)) return true;
    return false;
});

// Recursively looks for a field/property named n, reachable from o via
// fields and list items. Won't cross into other Unity objects/components,
// and tracks visited references to avoid cycles.
System.Func<object, string, int, System.Collections.Generic.HashSet<object>, object> findFieldDeep = null;
findFieldDeep = (o, n, depth, visited) => {
    if (o == null) return null;

    var t = o.GetType();
    if (isLeaf(t)) return null;

    if (!t.IsValueType) {
        if (visited.Contains(o)) return null;
        visited.Add(o);
    }

    var direct = getField(o, n) ?? getProp(o, n);
    if (direct != null) return direct;
    if (depth <= 0) return null;

    for (var wt = t; wt != null; wt = wt.BaseType) {
        foreach (var f in wt.GetFields(flags)) {
            object v;
            try { v = f.GetValue(o); } catch { continue; }
            if (v == null) continue;
            if ((v is UnityEngine.GameObject || v is UnityEngine.Component) && !ReferenceEquals(v, o)) continue;

            if (v is System.Collections.IEnumerable && !(v is string)) {
                foreach (var item in (System.Collections.IEnumerable)v) {
                    var found = findFieldDeep(item, n, depth - 1, visited);
                    if (found != null) return found;
                }
                continue;
            }

            var nested = findFieldDeep(v, n, depth - 1, visited);
            if (nested != null) return nested;
        }
    }

    return null;
};

// Reads the actual localization key off a LocalizedString via its real
// properties - no ToString()/regex parsing involved.
var getLocalizedKey = new System.Func<object, string>((v) => {
    if (!(v is UnityEngine.Localization.LocalizedString)) return null;
    var entryRef = getProp(v, "TableEntryReference");
    return entryRef == null ? null : getProp(entryRef, "Key") as string;
});

// Finds the first LocalizedString reachable from o, matched by actual
// type rather than by field name - so it works regardless of what the
// containing field is called (e.g. a Fluid asset's name field).
System.Func<object, int, System.Collections.Generic.HashSet<object>, object> findLocalizedString = null;
findLocalizedString = (o, depth, visited) => {
    if (o == null) return null;
    if (o is UnityEngine.Localization.LocalizedString) return o;

    var t = o.GetType();
    if (isLeaf(t) || depth <= 0) return null;
    if (!t.IsValueType) {
        if (visited.Contains(o)) return null;
        visited.Add(o);
    }

    for (var wt = t; wt != null; wt = wt.BaseType) {
        foreach (var f in wt.GetFields(flags)) {
            object v;
            try { v = f.GetValue(o); } catch { continue; }
            if (v == null) continue;
            if (v is UnityEngine.Localization.LocalizedString) return v;
            if (v is UnityEngine.Object && !ReferenceEquals(v, o)) continue;

            if (v is System.Collections.IEnumerable && !(v is string)) {
                foreach (var item in (System.Collections.IEnumerable)v) {
                    var found = findLocalizedString(item, depth - 1, visited);
                    if (found != null) return found;
                }
                continue;
            }

            var nested = findLocalizedString(v, depth - 1, visited);
            if (nested != null) return nested;
        }
    }

    return null;
};

// Looks up each candidate field name on the component (direct, then deep),
// and if what's found either is or contains a LocalizedString, returns its key.
var KEY_SOURCES = new[] { "m_PartName", "m_SprayName", "m_Content" };
var DESCRIPTION_KEY_SOURCES = new[] { "m_PartDescription" };

var extractLocKey = new System.Func<UnityEngine.Component, string[], string>((component, sourceNames) => {
    foreach (var name in sourceNames) {
        object value = getField(component, name) ?? getProp(component, name);
        if (value == null) value = findFieldDeep(component, name, MAX_DEPTH, new System.Collections.Generic.HashSet<object>());
        if (value == null) continue;

        var ls = findLocalizedString(value, MAX_DEPTH, new System.Collections.Generic.HashSet<object>());
        var key = getLocalizedKey(ls);
        if (!string.IsNullOrEmpty(key)) return key;
    }
    return null;
});

// Converts a reflected value into a plain, JSON-safe shape (dict/list/
// primitive only) so it can be handed to Json.NET without it wandering
// into Unity's computed properties or asset references.
System.Func<object, int, System.Collections.Generic.HashSet<object>, object> toJsonSafe = null;
toJsonSafe = (value, depth, visited) => {
    if (value == null) return null;

    if (value is UnityEngine.Color) {
        var c = (UnityEngine.Color)value;
        return new System.Collections.Generic.Dictionary<string, object> { { "r", c.r }, { "g", c.g }, { "b", c.b }, { "a", c.a } };
    }
    if (value is UnityEngine.Vector2) {
        var v = (UnityEngine.Vector2)value;
        return new System.Collections.Generic.Dictionary<string, object> { { "x", v.x }, { "y", v.y } };
    }
    if (value is UnityEngine.Vector3) {
        var v = (UnityEngine.Vector3)value;
        return new System.Collections.Generic.Dictionary<string, object> { { "x", v.x }, { "y", v.y }, { "z", v.z } };
    }
    if (value is UnityEngine.Vector4) {
        var v = (UnityEngine.Vector4)value;
        return new System.Collections.Generic.Dictionary<string, object> { { "x", v.x }, { "y", v.y }, { "z", v.z }, { "w", v.w } };
    }
    if (value is UnityEngine.Quaternion) {
        var q = (UnityEngine.Quaternion)value;
        return new System.Collections.Generic.Dictionary<string, object> { { "x", q.x }, { "y", q.y }, { "z", q.z }, { "w", q.w } };
    }

    var type = value.GetType();
    if (type.IsEnum) return value.ToString();
    if (type.IsPrimitive || value is string || value is decimal) return value;

    if (value is UnityEngine.Object) {
        var uo = (UnityEngine.Object)value;
        return uo == null ? null : uo.name;
    }

    if (value is System.Collections.IEnumerable) {
        var list = new System.Collections.Generic.List<object>();
        if (depth > 0)
            foreach (var item in (System.Collections.IEnumerable)value)
                list.Add(toJsonSafe(item, depth - 1, visited));
        return list;
    }

    if (!type.IsValueType) {
        if (visited.Contains(value)) return null;
        visited.Add(value);
    }
    if (depth <= 0) return value.ToString();

    var dict = new System.Collections.Generic.Dictionary<string, object>();
    for (var wt = type; wt != null; wt = wt.BaseType) {
        foreach (var f in wt.GetFields(flags)) {
            if (f.IsStatic || dict.ContainsKey(f.Name)) continue;
            object fv;
            try { fv = f.GetValue(value); } catch { continue; }
            dict[f.Name] = toJsonSafe(fv, depth - 1, visited);
        }
    }
    return dict;
};

var getAllowedFields = new System.Func<UnityEngine.Component, System.Collections.Generic.Dictionary<string, object>>((component) => {
    var result = new System.Collections.Generic.Dictionary<string, object>();
    if (component == null) return result;

    var compType = component.GetType().Name;

    foreach (var entry in ALLOWED_FIELDS) {
        var aliases = entry.Value.Item1;
        var typeFilter = entry.Value.Item2;
        if (typeFilter != null && System.Array.IndexOf(typeFilter, compType) < 0) continue;

        object value = null;
        for (int i = 0; i < aliases.Length && value == null; i++)
            value = getField(component, aliases[i]) ?? getProp(component, aliases[i]);

        for (int i = 0; i < aliases.Length && value == null; i++)
            value = findFieldDeep(component, aliases[i], MAX_DEPTH, new System.Collections.Generic.HashSet<object>());

        if (value != null)
            result[entry.Key] = toJsonSafe(value, MAX_DEPTH, new System.Collections.Generic.HashSet<object>());
    }

    return result;
});

var hasRequiredComponents = new System.Func<UnityEngine.GameObject, bool>((go) => {
    foreach (var wanted in REQUIRED_COMPONENTS) {
        var found = false;
        foreach (var c in go.GetComponents<UnityEngine.Component>()) {
            if (c != null && c.GetType().Name == wanted) { found = true; break; }
        }
        if (!found) return false;
    }
    return true;
});

var matchesName = new System.Func<UnityEngine.GameObject, bool>((go) => {
    if (go == null || NAME_FILTERS.Length == 0) return false;
    foreach (var filter in NAME_FILTERS) {
        if (!string.IsNullOrEmpty(filter) && go.name.IndexOf(filter, System.StringComparison.OrdinalIgnoreCase) >= 0)
            return true;
    }
    return false;
});

var matches = new System.Collections.Generic.List<UnityEngine.Transform>();
var stack = new System.Collections.Generic.Stack<UnityEngine.Transform>();
foreach (var root in roots) stack.Push(root.transform);

while (stack.Count > 0) {
    var current = stack.Pop();
    var go = current.gameObject;
    if (hasRequiredComponents(go) || matchesName(go)) matches.Add(current);
    for (int i = 0; i < current.childCount; i++) stack.Push(current.GetChild(i));
}

var mgr = UnityEngine.Object.FindObjectOfType<ES3Internal.ES3ReferenceMgrBase>();
var features = new System.Collections.Generic.List<object>();

for (int index = 0; index < matches.Count; index++) {
    var transform = matches[index];
    var go = transform.gameObject;

    long es3 = -1;
    if (mgr != null) { try { es3 = mgr.Get(go); } catch { } }

    var pathParts = new System.Collections.Generic.List<string>();
    for (var parent = transform.parent; parent != null; parent = parent.parent) pathParts.Add(parent.name);
    pathParts.Reverse();
    var path = string.Join("/", pathParts.ToArray());

    var properties = new System.Collections.Generic.Dictionary<string, object>();
    if (EXPORT_ES3 && es3 >= 0) properties["es3ref"] = es3;
    properties["name"] = go.name;
    properties["path"] = path;
    if (EXPORT_ACTIVE) properties["active"] = go.activeSelf;
    if (EXPORT_SCENE) properties["scene"] = scene.name;

    if (EXPORT_COMPONENTS) {
        var names = new System.Collections.Generic.List<string>();
        foreach (var c in go.GetComponents<UnityEngine.Component>()) {
            if (c != null && !(c is UnityEngine.Transform)) names.Add(c.GetType().Name);
        }
        properties["components"] = names;
    }

    var reflected = new System.Collections.Generic.Dictionary<string, object>();
    string key = null, descriptionKey = null;

    foreach (var c in go.GetComponents<UnityEngine.Component>()) {
        if (c == null || c is UnityEngine.Transform) continue;

        foreach (var pair in getAllowedFields(c))
            if (!reflected.ContainsKey(pair.Key)) reflected[pair.Key] = pair.Value;

        if (key == null) key = extractLocKey(c, KEY_SOURCES);
        if (descriptionKey == null) descriptionKey = extractLocKey(c, DESCRIPTION_KEY_SOURCES);
    }

    foreach (var pair in reflected) properties[pair.Key] = pair.Value;
    if (key != null) properties["key"] = key;
    if (descriptionKey != null) properties["descriptionKey"] = descriptionKey;

    var pos = transform.position;
    features.Add(new {
        type = "Feature",
        geometry = new { type = "Point", coordinates = new[] { pos.x, pos.y, pos.z } },
        properties = properties
    });

    if ((index + 1) % 1000 == 0 || index + 1 == matches.Count) {
        System.IO.File.WriteAllText(
            progress,
            "EXPORTING\n" + (index + 1) + "/" + matches.Count + " (" + ((index + 1) * 100 / matches.Count) + "%)\nOutput: " + output
        );
    }
}

var geojson = new { type = "FeatureCollection", features = features };

var json = Newtonsoft.Json.JsonConvert.SerializeObject(
    geojson,
    Newtonsoft.Json.Formatting.Indented,
    new Newtonsoft.Json.JsonSerializerSettings { ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore }
);

System.IO.File.WriteAllText(output, json, System.Text.Encoding.UTF8);
System.IO.File.WriteAllText(progress, "DONE\n" + matches.Count + "/" + matches.Count + " (100%)\nOutput: " + output);

"DONE: " + matches.Count + " objects exported to " + output;
