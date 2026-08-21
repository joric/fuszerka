var scene=UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var roots=scene.GetRootGameObjects();
var output=@"C:\Temp\markers.json";
var progress=@"C:\Temp\markers.progress";

var EXPORT_MATCHING_ONLY=true;
var MATCH_COMPONENTS=new[]{"ES3AutoSave","NpcAnimatorController","CarPartBehaviour","CarPart","ContainerTool","ItemIdentifier"};

var flags=System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.Public|System.Reflection.BindingFlags.NonPublic;

var field=new System.Func<object,string,object>((o,n)=>{
    if(o==null)return null;
    var t=o.GetType();
    while(t!=null){
        var f=t.GetField(n,flags);
        if(f!=null)try{return f.GetValue(o);}catch{}
        t=t.BaseType;
    }
    return null;
});

var prop=new System.Func<object,string,object>((o,n)=>{
    if(o==null)return null;
    var t=o.GetType();
    while(t!=null){
        var p=t.GetProperty(n,flags);
        if(p!=null&&p.GetIndexParameters().Length==0)try{return p.GetValue(o,null);}catch{}
        t=t.BaseType;
    }
    return null;
});

var locKey=new System.Func<object,string>(o=>{
    if(o==null)return null;
    var s=o.ToString();
    var m="TableEntryReference(";
    var p=s.IndexOf(m,StringComparison.Ordinal);
    if(p<0)return null;
    p+=m.Length;
    var e=s.IndexOf(')',p);
    if(e<0)return null;
    var x=s.Substring(p,e-p);
    var d=x.IndexOf(" - ",StringComparison.Ordinal);
    if(d>=0)x=x.Substring(d+3);
    return x.Trim().TrimEnd(')');
});

var esc=new System.Func<string,string>(s=>s==null?null:s.Replace("\\","\\\\").Replace("\"","\\\"").Replace("\r","\\r").Replace("\n","\\n"));

var shopNames=new System.Collections.Generic.Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);
var shopDescriptions=new System.Collections.Generic.Dictionary<string,string>(StringComparer.OrdinalIgnoreCase);

foreach(var so in UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.ScriptableObject>()){
    if(so==null||so.GetType().FullName!="Fuszerka.UI.Shop.ShopItem")continue;
    var prefab=prop(so,"Prefab") as UnityEngine.GameObject??field(so,"Prefab") as UnityEngine.GameObject;
    if(prefab==null)continue;
    var nk=locKey(field(so,"m_PartName"));
    var dk=locKey(field(so,"m_PartDescription"));
    if(!string.IsNullOrEmpty(nk))shopNames[prefab.name]=nk;
    if(!string.IsNullOrEmpty(dk))shopDescriptions[prefab.name]=dk;
}

var mgr=UnityEngine.Object.FindObjectOfType<ES3Internal.ES3ReferenceMgrBase>();
var stack=new System.Collections.Generic.Stack<UnityEngine.Transform>();

var matches=new System.Collections.Generic.List<UnityEngine.Transform>();

foreach(var r in roots)stack.Push(r.transform);

while(stack.Count>0){
    var t=stack.Pop();
    var go=t.gameObject;

    var match=!EXPORT_MATCHING_ONLY;

    if(EXPORT_MATCHING_ONLY){
        foreach(var c in go.GetComponents<UnityEngine.Component>()){
            if(c==null)continue;
            var name=c.GetType().Name;

            for(int i=0;i<MATCH_COMPONENTS.Length;i++){
                if(name==MATCH_COMPONENTS[i]){
                    match=true;
                    break;
                }
            }

            if(match)break;
        }
    }

    if(match)matches.Add(t);

    for(int i=0;i<t.childCount;i++)
        stack.Push(t.GetChild(i));
}

var total=matches.Count;
var done=0;

using(var writer=new System.IO.StreamWriter(output,false,System.Text.Encoding.UTF8)){
    writer.WriteLine("{\"type\":\"FeatureCollection\",\"features\":[");

    foreach(var t in matches){
        var go=t.gameObject;
        done++;

        long es3=-1;
        if(mgr!=null)try{es3=mgr.Get(go);}catch{}

        var path=new System.Collections.Generic.List<string>();
        for(var q=t;q!=null;q=q.parent)path.Add(q.name);
        path.Reverse();

        var itemType=(string)null;
        var itemId=(string)null;
        var itemName=(string)null;
        var partNameKey=(string)null;
        var partDescriptionKey=(string)null;
        var shopNameKey=(string)null;
        var shopDescriptionKey=(string)null;
        var components=new System.Collections.Generic.List<string>();

        foreach(var c in go.GetComponents<UnityEngine.Component>()){
            if(c==null)continue;
            if(!(c is UnityEngine.Transform))components.Add(c.GetType().Name);

            var ct=c.GetType().FullName;

            if(ct=="Fuszerka.Vehicles.CarPartBehaviour"){
                itemType="CarPart";
                var part=prop(c,"Part")??field(c,"Part");
                if(part!=null){
                    partNameKey=locKey(field(part,"m_PartName"));
                    partDescriptionKey=locKey(field(part,"m_PartDescription"));
                }
            }else if(ct=="Fuszerka.Vehicles.CarPart"){
                itemType="CarPart";
                partNameKey=locKey(field(c,"m_PartName"));
                partDescriptionKey=locKey(field(c,"m_PartDescription"));
            }else if(ct=="Fuszerka.Interactables.ContainerTool"){
                itemType="ContainerTool";
            }

            if(ct!=null&&ct.IndexOf("ItemIdentifier",StringComparison.OrdinalIgnoreCase)>=0){
                var list=field(c,"m_ItemDefinition") as System.Collections.IEnumerable;
                if(list!=null)foreach(var item in list){
                    if(item==null)continue;

                    var id=prop(item,"Id");
                    var def=prop(item,"Def");

                    if(id!=null)itemId=id.ToString();

                    if(def!=null){
                        var n=prop(def,"Name")??field(def,"m_ItemName");
                        if(n!=null)itemName=n.ToString();
                    }

                    if(string.IsNullOrEmpty(itemType))
                        itemType="Item";

                    break;
                }
            }
        }

        if(shopNames.ContainsKey(go.name)){
            shopNameKey=shopNames[go.name];
            shopDescriptions.TryGetValue(go.name,out shopDescriptionKey);
        }

        var pos=t.position;

        var x=pos.x.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var y=pos.y.ToString(System.Globalization.CultureInfo.InvariantCulture);
        var z=pos.z.ToString(System.Globalization.CultureInfo.InvariantCulture);

        var p=new System.Collections.Generic.List<string>();

        if(es3>=0)p.Add("\"es3ref\":\""+es3+"\"");
        p.Add("\"type\":\"GameObject\"");
        if(!string.IsNullOrEmpty(itemType))p.Add("\"itemType\":\""+esc(itemType)+"\"");
        if(components.Count>0)p.Add("\"components\":\""+esc(string.Join(",",components))+"\"");
        p.Add("\"name\":\""+esc(go.name)+"\"");
        p.Add("\"path\":\""+esc(string.Join("/",path))+"\"");
        p.Add("\"scene\":\""+esc(scene.name)+"\"");
        p.Add("\"active\":"+go.activeSelf.ToString().ToLower());
        if(!string.IsNullOrEmpty(itemId))p.Add("\"itemId\":\""+esc(itemId)+"\"");
        if(!string.IsNullOrEmpty(itemName))p.Add("\"itemName\":\""+esc(itemName)+"\"");
        if(!string.IsNullOrEmpty(partNameKey))p.Add("\"partNameKey\":\""+esc(partNameKey)+"\"");
        if(!string.IsNullOrEmpty(partDescriptionKey))p.Add("\"partDescriptionKey\":\""+esc(partDescriptionKey)+"\"");
        if(!string.IsNullOrEmpty(shopNameKey))p.Add("\"shopNameKey\":\""+esc(shopNameKey)+"\"");
        if(!string.IsNullOrEmpty(shopDescriptionKey))p.Add("\"shopDescriptionKey\":\""+esc(shopDescriptionKey)+"\"");

        writer.WriteLine("    {");
        writer.WriteLine("      \"type\":\"Feature\",");
        writer.WriteLine("      \"geometry\":{\"type\":\"Point\",\"coordinates\":["+x+","+y+","+z+"]},");
        writer.WriteLine("      \"properties\":{");

        for(int i=0;i<p.Count;i++)
            writer.WriteLine("        "+p[i]+(i+1<p.Count?",":""));

        writer.WriteLine("      }");
        writer.Write("    }");

        if(done<total)
            writer.Write(",");

        writer.WriteLine();

        if(done%1000==0||done==total)
            System.IO.File.WriteAllText(
                progress,
                "EXPORTING\n"+
                done+"/"+total+" ("+(done*100/total)+"%)\n"+
                "Matches: "+total+"\n"+
                "Output: "+output
            );
    }

    writer.WriteLine("  ]");
    writer.WriteLine("}");
}

System.IO.File.WriteAllText(
    progress,
    "DONE\n"+
    done+"/"+total+" (100%)\n"+
    "Matches: "+total+"\n"+
    "Output: "+output
);

"DONE: "+done+" matching objects exported to "+output;
