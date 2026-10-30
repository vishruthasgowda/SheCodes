// Workspace: upload, privacy scan, analysis results, dashboard, account.
var $=DC.$;
$("dt").innerHTML=TY.map(function(t){return'<option>'+t[0]+' '+t[1]+'</option>'}).join("");
$("five").innerHTML=FI.map(function(f,i){return'<div class="itm"><span>'+f[0]+'</span><div><b>'+(i+1)+'. '+f[1]+'</b><div class="ex"><b>Explain this to me:</b> '+f[2]+'</div></div></div>'}).join("");
$("five").onclick=function(e){var n=e.target.closest(".itm");if(n)n.classList.toggle("open")};
$("tabs").innerHTML=Object.keys(WI).map(function(k,i){return'<button class="'+(i?"":"on")+'">'+k+'</button>'}).join("");
function wi(k){$("wi").innerHTML="<ul style='margin:0;padding-left:20px'>"+WI[k].map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul>"}wi("Sign");
$("tabs").onclick=function(e){if(e.target.tagName!="BUTTON")return;[].forEach.call($("tabs").children,function(b){b.classList.remove("on")});e.target.classList.add("on");wi(e.target.textContent)};
function sim(){var m=+$("mo").value,p=Math.round(1000*m),f=function(n){return"₹"+n.toLocaleString("en-IN")};$("ml").textContent="If you delay payment by "+m+" month"+(m>1?"s":"");$("sim").innerHTML="Original amount: <b>₹50,000</b><br>Estimated penalty: <b style='color:var(--rd)'>"+f(p)+"</b><br>Total payable: <b>"+f(50000+p)+"</b>"}$("mo").oninput=sim;sim();
// Workspace
document.querySelector(".side").onclick=function(e){var v=e.target.getAttribute("data-v");if(!v)return;[].forEach.call(this.children,function(b){b.classList.toggle("on",b===e.target)});[].forEach.call(document.querySelectorAll(".main>[data-v]"),function(s){s.classList.toggle("hide",s.getAttribute("data-v")!==v)})};
var F=null;$("drop").onclick=function(){$("file").click()};
["dragover","dragenter"].forEach(function(n){$("drop").addEventListener(n,function(e){e.preventDefault();$("drop").classList.add("hv")})});
["dragleave","drop"].forEach(function(n){$("drop").addEventListener(n,function(e){e.preventDefault();$("drop").classList.remove("hv")})});
$("drop").addEventListener("drop",function(e){pick(e.dataTransfer.files[0])});$("file").onchange=function(){pick(this.files[0])};
function pick(f){if(!f)return;F=f;$("fn").textContent="✅ "+f.name;$("ps").textContent="";
 if(/\.txt$/i.test(f.name)){var r=new FileReader();r.onload=function(){var t=String(r.result),m=function(x){return(t.match(x)||[]).length};$("ps").textContent="🔒 Privacy Scan → Aadhaar: "+m(/\b\d{4}\s?\d{4}\s?\d{4}\b/g)+" · PAN: "+m(/\b[A-Z]{5}\d{4}[A-Z]\b/g)+" · Phone: "+m(/\b[6-9]\d{9}\b/g)+" · Email: "+m(/[\w.+-]+@[\w-]+\.[\w.]+/g)+($("mask").checked?" (will be masked)":"")};r.readAsText(f)}else $("ps").textContent="🔒 Privacy Scan runs after text extraction (OCR) for this file type."}
$("go").onclick=function(){if(!F){$("fn").textContent="Please choose a file first.";return}$("bar").classList.remove("hide");var i=$("bar").firstChild,w=0,t=setInterval(function(){w+=10;i.style.width=w+"%";if(w>=100){clearInterval(t);$("rn").textContent=F.name;$("upc").classList.add("hide");$("res").classList.remove("hide");$("bar").classList.add("hide");i.style.width="0";DOCS.unshift([F.name,$("dt").value.replace(/^\S+\s/,""),"r","Notice by 30 Nov"]);dash()}},130)};
$("again").onclick=function(){F=null;$("fn").textContent="";$("ps").textContent="";$("res").classList.add("hide");$("upc").classList.remove("hide")};
function dash(){var rk=DOCS.filter(function(d){return d[2]=="r"}).length,at=DOCS.filter(function(d){return d[2]=="a"}).length;
 $("kp").innerHTML=[["🔴",rk,"High-risk documents"],["🟡",at,"Need attention"],["📅",DOCS.length,"Deadlines approaching"],["💰","₹"+(35000+rk*10000).toLocaleString("en-IN"),"Potential exposure"]].map(function(s){return"<div><b>"+s[0]+" "+s[1]+"</b><span>"+s[2]+"</span></div>"}).join("");
 var L={r:["r","High risk"],a:["a","Attention"],g:["g","Safe"]};$("tb").innerHTML=DOCS.map(function(d){return"<tr><td><b>"+d[0].replace(/</g,"&lt;")+"</b></td><td>"+d[1]+'</td><td><span class="tg '+L[d[2]][0]+'">'+L[d[2]][1]+"</span></td><td>"+d[3]+"</td></tr>"}).join("")}dash();
$("out2").onclick=DC.logout;
function esc(t){return String(t).replace(/</g,"&lt;")}
DC.ready(function(U){$("hi").textContent=(U.name?"Hello, "+U.name:"Hello")+" 👋";$("acI").innerHTML="<b>"+esc(U.name||"Your account")+"</b><br>"+esc(U.email||U.phone||"")});
