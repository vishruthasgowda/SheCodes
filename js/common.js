// Shared: Firebase loading, session, nav buttons and page guards.
(function(){
var cfg=window.FIREBASE_CONFIG||{},LIVE=!!cfg.apiKey&&cfg.apiKey.indexOf("YOUR_")!==0;
var DC=window.DC={LIVE:LIVE,U:null,READY:false,FB:null,AUTH:null},Q=[];
DC.$=function(i){return document.getElementById(i)};
DC.ready=function(f){DC.READY?f(DC.U):Q.push(f)};
DC.who=function(u){return{uid:u.uid,name:u.displayName||"",email:u.email||"",phone:u.phoneNumber||""}};
DC.demoLogin=function(u){try{localStorage.setItem("dc_user",JSON.stringify(u))}catch(e){}DC.U=u;location.href="workspace.html"};
DC.logout=function(){try{localStorage.removeItem("dc_user")}catch(e){}
 var go=function(){location.href="index.html"};
 if(LIVE&&DC.AUTH)DC.FB.signOut(DC.AUTH).then(go,go);else{DC.U=null;go()}};
function apply(){var g=document.body.getAttribute("data-guard");
 if(g=="auth"&&!DC.U){location.replace("login.html");return}
 if(g=="guest"&&DC.U){location.replace("workspace.html");return}
 var a=DC.$("nLogin"),b=DC.$("nOut");if(a)a.classList.toggle("hide",!!DC.U);if(b)b.classList.toggle("hide",!DC.U);
 document.body.classList.add("ready");
 if(!DC.READY){DC.READY=true;var q=Q;Q=[];q.forEach(function(f){f(DC.U)})}}
function start(){var o=DC.$("nOut");if(o)o.onclick=DC.logout;
 if(!LIVE){try{DC.U=JSON.parse(localStorage.getItem("dc_user")||"null")}catch(e){}apply();return}
 var B="https://www.gstatic.com/firebasejs/10.12.2/";
 Promise.all([import(B+"firebase-app.js"),import(B+"firebase-auth.js")]).then(function(m){
  DC.FB=m[1];DC.AUTH=m[1].getAuth(m[0].initializeApp(cfg));
  m[1].onAuthStateChanged(DC.AUTH,function(u){DC.U=u?DC.who(u):null;apply()})
 }).catch(function(){var r=DC.$("aR");if(r)r.textContent="Couldn’t load sign-in. Check your internet connection and Firebase setup.";apply()})}
if(document.readyState=="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
