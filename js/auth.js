// Login page: Google sign-in and phone OTP (Firebase). Demo mode until keys are added.
(function(){
var $=DC.$,CONF=null,TM=null,RV=null;
if(!DC.LIVE)$("dm").classList.remove("hide");
function er(t){$("aR").textContent=t||""}
function msg(e){var c=(e&&e.code)||"";return({"auth/invalid-phone-number":"That phone number isn’t valid. Check the country code and digits.","auth/too-many-requests":"Too many attempts. Wait a few minutes and try again.","auth/invalid-verification-code":"That code is incorrect. Check the SMS and try again.","auth/code-expired":"That code has expired. Request a new one.","auth/popup-closed-by-user":"The Google window closed before sign-in finished.","auth/unauthorized-domain":"This website’s address isn’t in Firebase Authorized domains yet.","auth/operation-not-allowed":"This sign-in method isn’t turned on in Firebase yet.","auth/captcha-check-failed":"Verification failed. Refresh the page and try again.","auth/quota-exceeded":"SMS limit reached for this project. Try again later."})[c]||"Sign-in failed"+(c?" ("+c+")":"")+". Please try again."}
$("aG").onclick=function(){er();
 if(!DC.LIVE)return DC.demoLogin({name:"Demo User",email:"demo@docuclear.in",phone:""});
 if(!DC.AUTH)return er("Sign-in is still loading. Try again in a moment.");
 DC.FB.signInWithPopup(DC.AUTH,new DC.FB.GoogleAuthProvider()).catch(function(e){er(msg(e))})};
function tick(){var s=30,r=$("pRe");r.disabled=true;r.textContent="Resend OTP in 30s";clearInterval(TM);
 TM=setInterval(function(){s--;r.textContent=s>0?"Resend OTP in "+s+"s":"Resend OTP";if(s<=0){clearInterval(TM);r.disabled=false}},1000)}
function otpStep(full){$("stP").classList.add("hide");$("stO").classList.remove("hide");$("pTo").textContent="Enter the 6-digit code sent to "+full;$("pOtp").value="";$("pOtp").focus();tick()}
$("pSend").onclick=function(){er();
 var n=$("pNum").value.replace(/\D/g,"").replace(/^0+/,""),full=$("pCc").value+n;
 if(n.length<6||n.length>12)return er("Enter a valid mobile number.");
 if(!DC.LIVE)return otpStep(full);
 if(!DC.AUTH)return er("Sign-in is still loading. Try again in a moment.");
 var b=$("pSend");b.disabled=true;b.textContent="Sending…";
 try{RV=RV||new DC.FB.RecaptchaVerifier(DC.AUTH,"rcv",{size:"invisible"})}catch(x){}
 DC.FB.signInWithPhoneNumber(DC.AUTH,full,RV).then(function(r){CONF=r;otpStep(full)}).catch(function(e){try{RV.clear()}catch(x){}RV=null;er(msg(e))}).then(function(){b.disabled=false;b.textContent="Send OTP"})};
$("pRe").onclick=function(){$("pSend").onclick()};
$("pCh").onclick=function(){er();clearInterval(TM);$("stO").classList.add("hide");$("stP").classList.remove("hide")};
$("pVer").onclick=function(){er();var c=$("pOtp").value.trim();
 if(!/^\d{6}$/.test(c))return er("Enter the 6-digit code.");
 if(!DC.LIVE){var f=$("pCc").value+$("pNum").value.replace(/\D/g,"");return c=="123456"?DC.demoLogin({name:"Demo User",email:"",phone:f}):er("Demo mode: use the code 123456.")}
 if(!CONF)return er("Request a new OTP first.");
 var b=$("pVer");b.disabled=true;b.textContent="Verifying…";
 CONF.confirm(c).catch(function(e){er(msg(e))}).then(function(){b.disabled=false;b.textContent="Verify and continue"})};
})();
