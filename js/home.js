// Landing page: renders the feature cards and document types.
var $=DC.$;
$("feats").innerHTML=FE.map(function(f){return'<div class="card"><div class="ib">'+f[0]+'</div><h3>'+f[1]+'</h3><p>'+f[2]+'</p></div>'}).join("");
$("types").innerHTML=TY.map(function(t){return'<div>'+t[0]+' '+t[1]+'<small>'+t[2]+'</small></div>'}).join("");
