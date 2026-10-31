// 3D tilt on hover + scroll reveal. Purely visual; page works without it.
(function(){
var S=".card,.stats>div,.chips>div",rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
if(!rm){
document.addEventListener("mousemove",function(e){var c=e.target.closest&&e.target.closest(S);if(!c)return;var r=c.getBoundingClientRect();
 c.style.setProperty("--ry",((e.clientX-r.left)/r.width-.5)*8+"deg");c.style.setProperty("--rx",-((e.clientY-r.top)/r.height-.5)*8+"deg")});
document.addEventListener("mouseout",function(e){var c=e.target.closest&&e.target.closest(S);if(c){c.style.setProperty("--rx","0deg");c.style.setProperty("--ry","0deg")}});
if("IntersectionObserver"in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add("in");io.unobserve(x.target)}})},{threshold:.12});
 [].forEach.call(document.querySelectorAll(".sec .card,.sec .t,.sec .dk,.stats>div,.chips>div,details"),function(n){n.classList.add("rv");io.observe(n)})}}
})();
