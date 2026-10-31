// About page: differentiators and contact form.
var $=DC.$;
$("diff").innerHTML=FE.slice(0,6).map(function(f){return'<div class="card"><h3>'+f[0]+' '+f[1]+'</h3><p>'+f[2]+'</p></div>'}).join("");
$("cB").onclick=function(){$("cR").textContent=/^\S+@\S+\.\S+$/.test($("cE").value)&&$("cM").value.trim()?"Thanks! We’ll get back to you soon.":"Enter a valid email and a message."};
