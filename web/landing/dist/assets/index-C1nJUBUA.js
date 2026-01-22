(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))r(l);new MutationObserver(l=>{for(const o of l)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function n(l){const o={};return l.integrity&&(o.integrity=l.integrity),l.referrerPolicy&&(o.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?o.credentials="include":l.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(l){if(l.ep)return;l.ep=!0;const o=n(l);fetch(l.href,o)}})();function yd(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Os={exports:{}},Cl={},Ms={exports:{}},F={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ur=Symbol.for("react.element"),xd=Symbol.for("react.portal"),wd=Symbol.for("react.fragment"),kd=Symbol.for("react.strict_mode"),Sd=Symbol.for("react.profiler"),Ed=Symbol.for("react.provider"),Cd=Symbol.for("react.context"),jd=Symbol.for("react.forward_ref"),Nd=Symbol.for("react.suspense"),Pd=Symbol.for("react.memo"),Rd=Symbol.for("react.lazy"),ga=Symbol.iterator;function zd(e){return e===null||typeof e!="object"?null:(e=ga&&e[ga]||e["@@iterator"],typeof e=="function"?e:null)}var Ds={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Is=Object.assign,As={};function gn(e,t,n){this.props=e,this.context=t,this.refs=As,this.updater=n||Ds}gn.prototype.isReactComponent={};gn.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};gn.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Us(){}Us.prototype=gn.prototype;function gi(e,t,n){this.props=e,this.context=t,this.refs=As,this.updater=n||Ds}var vi=gi.prototype=new Us;vi.constructor=gi;Is(vi,gn.prototype);vi.isPureReactComponent=!0;var va=Array.isArray,Bs=Object.prototype.hasOwnProperty,yi={current:null},$s={key:!0,ref:!0,__self:!0,__source:!0};function Hs(e,t,n){var r,l={},o=null,i=null;if(t!=null)for(r in t.ref!==void 0&&(i=t.ref),t.key!==void 0&&(o=""+t.key),t)Bs.call(t,r)&&!$s.hasOwnProperty(r)&&(l[r]=t[r]);var a=arguments.length-2;if(a===1)l.children=n;else if(1<a){for(var s=Array(a),c=0;c<a;c++)s[c]=arguments[c+2];l.children=s}if(e&&e.defaultProps)for(r in a=e.defaultProps,a)l[r]===void 0&&(l[r]=a[r]);return{$$typeof:ur,type:e,key:o,ref:i,props:l,_owner:yi.current}}function _d(e,t){return{$$typeof:ur,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function xi(e){return typeof e=="object"&&e!==null&&e.$$typeof===ur}function Ld(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var ya=/\/+/g;function Ql(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Ld(""+e.key):t.toString(36)}function Ir(e,t,n,r,l){var o=typeof e;(o==="undefined"||o==="boolean")&&(e=null);var i=!1;if(e===null)i=!0;else switch(o){case"string":case"number":i=!0;break;case"object":switch(e.$$typeof){case ur:case xd:i=!0}}if(i)return i=e,l=l(i),e=r===""?"."+Ql(i,0):r,va(l)?(n="",e!=null&&(n=e.replace(ya,"$&/")+"/"),Ir(l,t,n,"",function(c){return c})):l!=null&&(xi(l)&&(l=_d(l,n+(!l.key||i&&i.key===l.key?"":(""+l.key).replace(ya,"$&/")+"/")+e)),t.push(l)),1;if(i=0,r=r===""?".":r+":",va(e))for(var a=0;a<e.length;a++){o=e[a];var s=r+Ql(o,a);i+=Ir(o,t,n,s,l)}else if(s=zd(e),typeof s=="function")for(e=s.call(e),a=0;!(o=e.next()).done;)o=o.value,s=r+Ql(o,a++),i+=Ir(o,t,n,s,l);else if(o==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return i}function xr(e,t,n){if(e==null)return e;var r=[],l=0;return Ir(e,r,"","",function(o){return t.call(n,o,l++)}),r}function Td(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var ue={current:null},Ar={transition:null},Fd={ReactCurrentDispatcher:ue,ReactCurrentBatchConfig:Ar,ReactCurrentOwner:yi};function Ws(){throw Error("act(...) is not supported in production builds of React.")}F.Children={map:xr,forEach:function(e,t,n){xr(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return xr(e,function(){t++}),t},toArray:function(e){return xr(e,function(t){return t})||[]},only:function(e){if(!xi(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};F.Component=gn;F.Fragment=wd;F.Profiler=Sd;F.PureComponent=gi;F.StrictMode=kd;F.Suspense=Nd;F.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Fd;F.act=Ws;F.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=Is({},e.props),l=e.key,o=e.ref,i=e._owner;if(t!=null){if(t.ref!==void 0&&(o=t.ref,i=yi.current),t.key!==void 0&&(l=""+t.key),e.type&&e.type.defaultProps)var a=e.type.defaultProps;for(s in t)Bs.call(t,s)&&!$s.hasOwnProperty(s)&&(r[s]=t[s]===void 0&&a!==void 0?a[s]:t[s])}var s=arguments.length-2;if(s===1)r.children=n;else if(1<s){a=Array(s);for(var c=0;c<s;c++)a[c]=arguments[c+2];r.children=a}return{$$typeof:ur,type:e.type,key:l,ref:o,props:r,_owner:i}};F.createContext=function(e){return e={$$typeof:Cd,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:Ed,_context:e},e.Consumer=e};F.createElement=Hs;F.createFactory=function(e){var t=Hs.bind(null,e);return t.type=e,t};F.createRef=function(){return{current:null}};F.forwardRef=function(e){return{$$typeof:jd,render:e}};F.isValidElement=xi;F.lazy=function(e){return{$$typeof:Rd,_payload:{_status:-1,_result:e},_init:Td}};F.memo=function(e,t){return{$$typeof:Pd,type:e,compare:t===void 0?null:t}};F.startTransition=function(e){var t=Ar.transition;Ar.transition={};try{e()}finally{Ar.transition=t}};F.unstable_act=Ws;F.useCallback=function(e,t){return ue.current.useCallback(e,t)};F.useContext=function(e){return ue.current.useContext(e)};F.useDebugValue=function(){};F.useDeferredValue=function(e){return ue.current.useDeferredValue(e)};F.useEffect=function(e,t){return ue.current.useEffect(e,t)};F.useId=function(){return ue.current.useId()};F.useImperativeHandle=function(e,t,n){return ue.current.useImperativeHandle(e,t,n)};F.useInsertionEffect=function(e,t){return ue.current.useInsertionEffect(e,t)};F.useLayoutEffect=function(e,t){return ue.current.useLayoutEffect(e,t)};F.useMemo=function(e,t){return ue.current.useMemo(e,t)};F.useReducer=function(e,t,n){return ue.current.useReducer(e,t,n)};F.useRef=function(e){return ue.current.useRef(e)};F.useState=function(e){return ue.current.useState(e)};F.useSyncExternalStore=function(e,t,n){return ue.current.useSyncExternalStore(e,t,n)};F.useTransition=function(){return ue.current.useTransition()};F.version="18.3.1";Ms.exports=F;var v=Ms.exports;const ft=yd(v);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Od=v,Md=Symbol.for("react.element"),Dd=Symbol.for("react.fragment"),Id=Object.prototype.hasOwnProperty,Ad=Od.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Ud={key:!0,ref:!0,__self:!0,__source:!0};function Vs(e,t,n){var r,l={},o=null,i=null;n!==void 0&&(o=""+n),t.key!==void 0&&(o=""+t.key),t.ref!==void 0&&(i=t.ref);for(r in t)Id.call(t,r)&&!Ud.hasOwnProperty(r)&&(l[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)l[r]===void 0&&(l[r]=t[r]);return{$$typeof:Md,type:e,key:o,ref:i,props:l,_owner:Ad.current}}Cl.Fragment=Dd;Cl.jsx=Vs;Cl.jsxs=Vs;Os.exports=Cl;var u=Os.exports,ko={},Qs={exports:{}},Se={},Ys={exports:{}},Ks={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(e){function t(R,L){var T=R.length;R.push(L);e:for(;0<T;){var Y=T-1>>>1,J=R[Y];if(0<l(J,L))R[Y]=L,R[T]=J,T=Y;else break e}}function n(R){return R.length===0?null:R[0]}function r(R){if(R.length===0)return null;var L=R[0],T=R.pop();if(T!==L){R[0]=T;e:for(var Y=0,J=R.length,vr=J>>>1;Y<vr;){var Nt=2*(Y+1)-1,Vl=R[Nt],Pt=Nt+1,yr=R[Pt];if(0>l(Vl,T))Pt<J&&0>l(yr,Vl)?(R[Y]=yr,R[Pt]=T,Y=Pt):(R[Y]=Vl,R[Nt]=T,Y=Nt);else if(Pt<J&&0>l(yr,T))R[Y]=yr,R[Pt]=T,Y=Pt;else break e}}return L}function l(R,L){var T=R.sortIndex-L.sortIndex;return T!==0?T:R.id-L.id}if(typeof performance=="object"&&typeof performance.now=="function"){var o=performance;e.unstable_now=function(){return o.now()}}else{var i=Date,a=i.now();e.unstable_now=function(){return i.now()-a}}var s=[],c=[],m=1,h=null,g=3,y=!1,x=!1,k=!1,C=typeof setTimeout=="function"?setTimeout:null,f=typeof clearTimeout=="function"?clearTimeout:null,d=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function p(R){for(var L=n(c);L!==null;){if(L.callback===null)r(c);else if(L.startTime<=R)r(c),L.sortIndex=L.expirationTime,t(s,L);else break;L=n(c)}}function w(R){if(k=!1,p(R),!x)if(n(s)!==null)x=!0,Hl(E);else{var L=n(c);L!==null&&Wl(w,L.startTime-R)}}function E(R,L){x=!1,k&&(k=!1,f(z),z=-1),y=!0;var T=g;try{for(p(L),h=n(s);h!==null&&(!(h.expirationTime>L)||R&&!Le());){var Y=h.callback;if(typeof Y=="function"){h.callback=null,g=h.priorityLevel;var J=Y(h.expirationTime<=L);L=e.unstable_now(),typeof J=="function"?h.callback=J:h===n(s)&&r(s),p(L)}else r(s);h=n(s)}if(h!==null)var vr=!0;else{var Nt=n(c);Nt!==null&&Wl(w,Nt.startTime-L),vr=!1}return vr}finally{h=null,g=T,y=!1}}var j=!1,P=null,z=-1,D=5,_=-1;function Le(){return!(e.unstable_now()-_<D)}function kn(){if(P!==null){var R=e.unstable_now();_=R;var L=!0;try{L=P(!0,R)}finally{L?Sn():(j=!1,P=null)}}else j=!1}var Sn;if(typeof d=="function")Sn=function(){d(kn)};else if(typeof MessageChannel<"u"){var ma=new MessageChannel,vd=ma.port2;ma.port1.onmessage=kn,Sn=function(){vd.postMessage(null)}}else Sn=function(){C(kn,0)};function Hl(R){P=R,j||(j=!0,Sn())}function Wl(R,L){z=C(function(){R(e.unstable_now())},L)}e.unstable_IdlePriority=5,e.unstable_ImmediatePriority=1,e.unstable_LowPriority=4,e.unstable_NormalPriority=3,e.unstable_Profiling=null,e.unstable_UserBlockingPriority=2,e.unstable_cancelCallback=function(R){R.callback=null},e.unstable_continueExecution=function(){x||y||(x=!0,Hl(E))},e.unstable_forceFrameRate=function(R){0>R||125<R?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):D=0<R?Math.floor(1e3/R):5},e.unstable_getCurrentPriorityLevel=function(){return g},e.unstable_getFirstCallbackNode=function(){return n(s)},e.unstable_next=function(R){switch(g){case 1:case 2:case 3:var L=3;break;default:L=g}var T=g;g=L;try{return R()}finally{g=T}},e.unstable_pauseExecution=function(){},e.unstable_requestPaint=function(){},e.unstable_runWithPriority=function(R,L){switch(R){case 1:case 2:case 3:case 4:case 5:break;default:R=3}var T=g;g=R;try{return L()}finally{g=T}},e.unstable_scheduleCallback=function(R,L,T){var Y=e.unstable_now();switch(typeof T=="object"&&T!==null?(T=T.delay,T=typeof T=="number"&&0<T?Y+T:Y):T=Y,R){case 1:var J=-1;break;case 2:J=250;break;case 5:J=1073741823;break;case 4:J=1e4;break;default:J=5e3}return J=T+J,R={id:m++,callback:L,priorityLevel:R,startTime:T,expirationTime:J,sortIndex:-1},T>Y?(R.sortIndex=T,t(c,R),n(s)===null&&R===n(c)&&(k?(f(z),z=-1):k=!0,Wl(w,T-Y))):(R.sortIndex=J,t(s,R),x||y||(x=!0,Hl(E))),R},e.unstable_shouldYield=Le,e.unstable_wrapCallback=function(R){var L=g;return function(){var T=g;g=L;try{return R.apply(this,arguments)}finally{g=T}}}})(Ks);Ys.exports=Ks;var Bd=Ys.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var $d=v,ke=Bd;function S(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Gs=new Set,Qn={};function Bt(e,t){un(e,t),un(e+"Capture",t)}function un(e,t){for(Qn[e]=t,e=0;e<t.length;e++)Gs.add(t[e])}var qe=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),So=Object.prototype.hasOwnProperty,Hd=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,xa={},wa={};function Wd(e){return So.call(wa,e)?!0:So.call(xa,e)?!1:Hd.test(e)?wa[e]=!0:(xa[e]=!0,!1)}function Vd(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function Qd(e,t,n,r){if(t===null||typeof t>"u"||Vd(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function ce(e,t,n,r,l,o,i){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=l,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=o,this.removeEmptyString=i}var ne={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){ne[e]=new ce(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];ne[t]=new ce(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){ne[e]=new ce(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){ne[e]=new ce(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){ne[e]=new ce(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){ne[e]=new ce(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){ne[e]=new ce(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){ne[e]=new ce(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){ne[e]=new ce(e,5,!1,e.toLowerCase(),null,!1,!1)});var wi=/[\-:]([a-z])/g;function ki(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(wi,ki);ne[t]=new ce(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(wi,ki);ne[t]=new ce(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(wi,ki);ne[t]=new ce(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){ne[e]=new ce(e,1,!1,e.toLowerCase(),null,!1,!1)});ne.xlinkHref=new ce("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){ne[e]=new ce(e,1,!1,e.toLowerCase(),null,!0,!0)});function Si(e,t,n,r){var l=ne.hasOwnProperty(t)?ne[t]:null;(l!==null?l.type!==0:r||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(Qd(t,n,l,r)&&(n=null),r||l===null?Wd(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):l.mustUseProperty?e[l.propertyName]=n===null?l.type===3?!1:"":n:(t=l.attributeName,r=l.attributeNamespace,n===null?e.removeAttribute(t):(l=l.type,n=l===3||l===4&&n===!0?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var lt=$d.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,wr=Symbol.for("react.element"),Vt=Symbol.for("react.portal"),Qt=Symbol.for("react.fragment"),Ei=Symbol.for("react.strict_mode"),Eo=Symbol.for("react.profiler"),Xs=Symbol.for("react.provider"),bs=Symbol.for("react.context"),Ci=Symbol.for("react.forward_ref"),Co=Symbol.for("react.suspense"),jo=Symbol.for("react.suspense_list"),ji=Symbol.for("react.memo"),it=Symbol.for("react.lazy"),Js=Symbol.for("react.offscreen"),ka=Symbol.iterator;function En(e){return e===null||typeof e!="object"?null:(e=ka&&e[ka]||e["@@iterator"],typeof e=="function"?e:null)}var V=Object.assign,Yl;function Tn(e){if(Yl===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Yl=t&&t[1]||""}return`
`+Yl+e}var Kl=!1;function Gl(e,t){if(!e||Kl)return"";Kl=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(c){var r=c}Reflect.construct(e,[],t)}else{try{t.call()}catch(c){r=c}e.call(t.prototype)}else{try{throw Error()}catch(c){r=c}e()}}catch(c){if(c&&r&&typeof c.stack=="string"){for(var l=c.stack.split(`
`),o=r.stack.split(`
`),i=l.length-1,a=o.length-1;1<=i&&0<=a&&l[i]!==o[a];)a--;for(;1<=i&&0<=a;i--,a--)if(l[i]!==o[a]){if(i!==1||a!==1)do if(i--,a--,0>a||l[i]!==o[a]){var s=`
`+l[i].replace(" at new "," at ");return e.displayName&&s.includes("<anonymous>")&&(s=s.replace("<anonymous>",e.displayName)),s}while(1<=i&&0<=a);break}}}finally{Kl=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:"")?Tn(e):""}function Yd(e){switch(e.tag){case 5:return Tn(e.type);case 16:return Tn("Lazy");case 13:return Tn("Suspense");case 19:return Tn("SuspenseList");case 0:case 2:case 15:return e=Gl(e.type,!1),e;case 11:return e=Gl(e.type.render,!1),e;case 1:return e=Gl(e.type,!0),e;default:return""}}function No(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Qt:return"Fragment";case Vt:return"Portal";case Eo:return"Profiler";case Ei:return"StrictMode";case Co:return"Suspense";case jo:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case bs:return(e.displayName||"Context")+".Consumer";case Xs:return(e._context.displayName||"Context")+".Provider";case Ci:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ji:return t=e.displayName||null,t!==null?t:No(e.type)||"Memo";case it:t=e._payload,e=e._init;try{return No(e(t))}catch{}}return null}function Kd(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return No(t);case 8:return t===Ei?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function kt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Zs(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Gd(e){var t=Zs(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var l=n.get,o=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return l.call(this)},set:function(i){r=""+i,o.call(this,i)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(i){r=""+i},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function kr(e){e._valueTracker||(e._valueTracker=Gd(e))}function qs(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=Zs(e)?e.checked?"true":"false":e.value),e=r,e!==n?(t.setValue(e),!0):!1}function Jr(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Po(e,t){var n=t.checked;return V({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function Sa(e,t){var n=t.defaultValue==null?"":t.defaultValue,r=t.checked!=null?t.checked:t.defaultChecked;n=kt(t.value!=null?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function eu(e,t){t=t.checked,t!=null&&Si(e,"checked",t,!1)}function Ro(e,t){eu(e,t);var n=kt(t.value),r=t.type;if(n!=null)r==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?zo(e,t.type,n):t.hasOwnProperty("defaultValue")&&zo(e,t.type,kt(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function Ea(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!(r!=="submit"&&r!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}function zo(e,t,n){(t!=="number"||Jr(e.ownerDocument)!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}var Fn=Array.isArray;function nn(e,t,n,r){if(e=e.options,t){t={};for(var l=0;l<n.length;l++)t["$"+n[l]]=!0;for(n=0;n<e.length;n++)l=t.hasOwnProperty("$"+e[n].value),e[n].selected!==l&&(e[n].selected=l),l&&r&&(e[n].defaultSelected=!0)}else{for(n=""+kt(n),t=null,l=0;l<e.length;l++){if(e[l].value===n){e[l].selected=!0,r&&(e[l].defaultSelected=!0);return}t!==null||e[l].disabled||(t=e[l])}t!==null&&(t.selected=!0)}}function _o(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(S(91));return V({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Ca(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(S(92));if(Fn(n)){if(1<n.length)throw Error(S(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:kt(n)}}function tu(e,t){var n=kt(t.value),r=kt(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=""+r)}function ja(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function nu(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Lo(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?nu(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var Sr,ru=function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,n,r,l){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,l)})}:e}(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(Sr=Sr||document.createElement("div"),Sr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=Sr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Yn(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Dn={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Xd=["Webkit","ms","Moz","O"];Object.keys(Dn).forEach(function(e){Xd.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Dn[t]=Dn[e]})});function lu(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||Dn.hasOwnProperty(e)&&Dn[e]?(""+t).trim():t+"px"}function ou(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var r=n.indexOf("--")===0,l=lu(n,t[n],r);n==="float"&&(n="cssFloat"),r?e.setProperty(n,l):e[n]=l}}var bd=V({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function To(e,t){if(t){if(bd[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(S(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(S(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(S(61))}if(t.style!=null&&typeof t.style!="object")throw Error(S(62))}}function Fo(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Oo=null;function Ni(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Mo=null,rn=null,ln=null;function Na(e){if(e=fr(e)){if(typeof Mo!="function")throw Error(S(280));var t=e.stateNode;t&&(t=zl(t),Mo(e.stateNode,e.type,t))}}function iu(e){rn?ln?ln.push(e):ln=[e]:rn=e}function au(){if(rn){var e=rn,t=ln;if(ln=rn=null,Na(e),t)for(e=0;e<t.length;e++)Na(t[e])}}function su(e,t){return e(t)}function uu(){}var Xl=!1;function cu(e,t,n){if(Xl)return e(t,n);Xl=!0;try{return su(e,t,n)}finally{Xl=!1,(rn!==null||ln!==null)&&(uu(),au())}}function Kn(e,t){var n=e.stateNode;if(n===null)return null;var r=zl(n);if(r===null)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(S(231,t,typeof n));return n}var Do=!1;if(qe)try{var Cn={};Object.defineProperty(Cn,"passive",{get:function(){Do=!0}}),window.addEventListener("test",Cn,Cn),window.removeEventListener("test",Cn,Cn)}catch{Do=!1}function Jd(e,t,n,r,l,o,i,a,s){var c=Array.prototype.slice.call(arguments,3);try{t.apply(n,c)}catch(m){this.onError(m)}}var In=!1,Zr=null,qr=!1,Io=null,Zd={onError:function(e){In=!0,Zr=e}};function qd(e,t,n,r,l,o,i,a,s){In=!1,Zr=null,Jd.apply(Zd,arguments)}function ef(e,t,n,r,l,o,i,a,s){if(qd.apply(this,arguments),In){if(In){var c=Zr;In=!1,Zr=null}else throw Error(S(198));qr||(qr=!0,Io=c)}}function $t(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,t.flags&4098&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function du(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Pa(e){if($t(e)!==e)throw Error(S(188))}function tf(e){var t=e.alternate;if(!t){if(t=$t(e),t===null)throw Error(S(188));return t!==e?null:e}for(var n=e,r=t;;){var l=n.return;if(l===null)break;var o=l.alternate;if(o===null){if(r=l.return,r!==null){n=r;continue}break}if(l.child===o.child){for(o=l.child;o;){if(o===n)return Pa(l),e;if(o===r)return Pa(l),t;o=o.sibling}throw Error(S(188))}if(n.return!==r.return)n=l,r=o;else{for(var i=!1,a=l.child;a;){if(a===n){i=!0,n=l,r=o;break}if(a===r){i=!0,r=l,n=o;break}a=a.sibling}if(!i){for(a=o.child;a;){if(a===n){i=!0,n=o,r=l;break}if(a===r){i=!0,r=o,n=l;break}a=a.sibling}if(!i)throw Error(S(189))}}if(n.alternate!==r)throw Error(S(190))}if(n.tag!==3)throw Error(S(188));return n.stateNode.current===n?e:t}function fu(e){return e=tf(e),e!==null?pu(e):null}function pu(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=pu(e);if(t!==null)return t;e=e.sibling}return null}var hu=ke.unstable_scheduleCallback,Ra=ke.unstable_cancelCallback,nf=ke.unstable_shouldYield,rf=ke.unstable_requestPaint,K=ke.unstable_now,lf=ke.unstable_getCurrentPriorityLevel,Pi=ke.unstable_ImmediatePriority,mu=ke.unstable_UserBlockingPriority,el=ke.unstable_NormalPriority,of=ke.unstable_LowPriority,gu=ke.unstable_IdlePriority,jl=null,We=null;function af(e){if(We&&typeof We.onCommitFiberRoot=="function")try{We.onCommitFiberRoot(jl,e,void 0,(e.current.flags&128)===128)}catch{}}var De=Math.clz32?Math.clz32:cf,sf=Math.log,uf=Math.LN2;function cf(e){return e>>>=0,e===0?32:31-(sf(e)/uf|0)|0}var Er=64,Cr=4194304;function On(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function tl(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,l=e.suspendedLanes,o=e.pingedLanes,i=n&268435455;if(i!==0){var a=i&~l;a!==0?r=On(a):(o&=i,o!==0&&(r=On(o)))}else i=n&~l,i!==0?r=On(i):o!==0&&(r=On(o));if(r===0)return 0;if(t!==0&&t!==r&&!(t&l)&&(l=r&-r,o=t&-t,l>=o||l===16&&(o&4194240)!==0))return t;if(r&4&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-De(t),l=1<<n,r|=e[n],t&=~l;return r}function df(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function ff(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,l=e.expirationTimes,o=e.pendingLanes;0<o;){var i=31-De(o),a=1<<i,s=l[i];s===-1?(!(a&n)||a&r)&&(l[i]=df(a,t)):s<=t&&(e.expiredLanes|=a),o&=~a}}function Ao(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function vu(){var e=Er;return Er<<=1,!(Er&4194240)&&(Er=64),e}function bl(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function cr(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-De(t),e[t]=n}function pf(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var l=31-De(n),o=1<<l;t[l]=0,r[l]=-1,e[l]=-1,n&=~o}}function Ri(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-De(n),l=1<<r;l&t|e[r]&t&&(e[r]|=t),n&=~l}}var M=0;function yu(e){return e&=-e,1<e?4<e?e&268435455?16:536870912:4:1}var xu,zi,wu,ku,Su,Uo=!1,jr=[],pt=null,ht=null,mt=null,Gn=new Map,Xn=new Map,st=[],hf="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function za(e,t){switch(e){case"focusin":case"focusout":pt=null;break;case"dragenter":case"dragleave":ht=null;break;case"mouseover":case"mouseout":mt=null;break;case"pointerover":case"pointerout":Gn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Xn.delete(t.pointerId)}}function jn(e,t,n,r,l,o){return e===null||e.nativeEvent!==o?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:o,targetContainers:[l]},t!==null&&(t=fr(t),t!==null&&zi(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,l!==null&&t.indexOf(l)===-1&&t.push(l),e)}function mf(e,t,n,r,l){switch(t){case"focusin":return pt=jn(pt,e,t,n,r,l),!0;case"dragenter":return ht=jn(ht,e,t,n,r,l),!0;case"mouseover":return mt=jn(mt,e,t,n,r,l),!0;case"pointerover":var o=l.pointerId;return Gn.set(o,jn(Gn.get(o)||null,e,t,n,r,l)),!0;case"gotpointercapture":return o=l.pointerId,Xn.set(o,jn(Xn.get(o)||null,e,t,n,r,l)),!0}return!1}function Eu(e){var t=_t(e.target);if(t!==null){var n=$t(t);if(n!==null){if(t=n.tag,t===13){if(t=du(n),t!==null){e.blockedOn=t,Su(e.priority,function(){wu(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ur(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Bo(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);Oo=r,n.target.dispatchEvent(r),Oo=null}else return t=fr(n),t!==null&&zi(t),e.blockedOn=n,!1;t.shift()}return!0}function _a(e,t,n){Ur(e)&&n.delete(t)}function gf(){Uo=!1,pt!==null&&Ur(pt)&&(pt=null),ht!==null&&Ur(ht)&&(ht=null),mt!==null&&Ur(mt)&&(mt=null),Gn.forEach(_a),Xn.forEach(_a)}function Nn(e,t){e.blockedOn===t&&(e.blockedOn=null,Uo||(Uo=!0,ke.unstable_scheduleCallback(ke.unstable_NormalPriority,gf)))}function bn(e){function t(l){return Nn(l,e)}if(0<jr.length){Nn(jr[0],e);for(var n=1;n<jr.length;n++){var r=jr[n];r.blockedOn===e&&(r.blockedOn=null)}}for(pt!==null&&Nn(pt,e),ht!==null&&Nn(ht,e),mt!==null&&Nn(mt,e),Gn.forEach(t),Xn.forEach(t),n=0;n<st.length;n++)r=st[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<st.length&&(n=st[0],n.blockedOn===null);)Eu(n),n.blockedOn===null&&st.shift()}var on=lt.ReactCurrentBatchConfig,nl=!0;function vf(e,t,n,r){var l=M,o=on.transition;on.transition=null;try{M=1,_i(e,t,n,r)}finally{M=l,on.transition=o}}function yf(e,t,n,r){var l=M,o=on.transition;on.transition=null;try{M=4,_i(e,t,n,r)}finally{M=l,on.transition=o}}function _i(e,t,n,r){if(nl){var l=Bo(e,t,n,r);if(l===null)io(e,t,r,rl,n),za(e,r);else if(mf(l,e,t,n,r))r.stopPropagation();else if(za(e,r),t&4&&-1<hf.indexOf(e)){for(;l!==null;){var o=fr(l);if(o!==null&&xu(o),o=Bo(e,t,n,r),o===null&&io(e,t,r,rl,n),o===l)break;l=o}l!==null&&r.stopPropagation()}else io(e,t,r,null,n)}}var rl=null;function Bo(e,t,n,r){if(rl=null,e=Ni(r),e=_t(e),e!==null)if(t=$t(e),t===null)e=null;else if(n=t.tag,n===13){if(e=du(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return rl=e,null}function Cu(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(lf()){case Pi:return 1;case mu:return 4;case el:case of:return 16;case gu:return 536870912;default:return 16}default:return 16}}var ct=null,Li=null,Br=null;function ju(){if(Br)return Br;var e,t=Li,n=t.length,r,l="value"in ct?ct.value:ct.textContent,o=l.length;for(e=0;e<n&&t[e]===l[e];e++);var i=n-e;for(r=1;r<=i&&t[n-r]===l[o-r];r++);return Br=l.slice(e,1<r?1-r:void 0)}function $r(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Nr(){return!0}function La(){return!1}function Ee(e){function t(n,r,l,o,i){this._reactName=n,this._targetInst=l,this.type=r,this.nativeEvent=o,this.target=i,this.currentTarget=null;for(var a in e)e.hasOwnProperty(a)&&(n=e[a],this[a]=n?n(o):o[a]);return this.isDefaultPrevented=(o.defaultPrevented!=null?o.defaultPrevented:o.returnValue===!1)?Nr:La,this.isPropagationStopped=La,this}return V(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=Nr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=Nr)},persist:function(){},isPersistent:Nr}),t}var vn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Ti=Ee(vn),dr=V({},vn,{view:0,detail:0}),xf=Ee(dr),Jl,Zl,Pn,Nl=V({},dr,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Fi,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Pn&&(Pn&&e.type==="mousemove"?(Jl=e.screenX-Pn.screenX,Zl=e.screenY-Pn.screenY):Zl=Jl=0,Pn=e),Jl)},movementY:function(e){return"movementY"in e?e.movementY:Zl}}),Ta=Ee(Nl),wf=V({},Nl,{dataTransfer:0}),kf=Ee(wf),Sf=V({},dr,{relatedTarget:0}),ql=Ee(Sf),Ef=V({},vn,{animationName:0,elapsedTime:0,pseudoElement:0}),Cf=Ee(Ef),jf=V({},vn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Nf=Ee(jf),Pf=V({},vn,{data:0}),Fa=Ee(Pf),Rf={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},zf={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},_f={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Lf(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=_f[e])?!!t[e]:!1}function Fi(){return Lf}var Tf=V({},dr,{key:function(e){if(e.key){var t=Rf[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=$r(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?zf[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Fi,charCode:function(e){return e.type==="keypress"?$r(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?$r(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Ff=Ee(Tf),Of=V({},Nl,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Oa=Ee(Of),Mf=V({},dr,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Fi}),Df=Ee(Mf),If=V({},vn,{propertyName:0,elapsedTime:0,pseudoElement:0}),Af=Ee(If),Uf=V({},Nl,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Bf=Ee(Uf),$f=[9,13,27,32],Oi=qe&&"CompositionEvent"in window,An=null;qe&&"documentMode"in document&&(An=document.documentMode);var Hf=qe&&"TextEvent"in window&&!An,Nu=qe&&(!Oi||An&&8<An&&11>=An),Ma=" ",Da=!1;function Pu(e,t){switch(e){case"keyup":return $f.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Ru(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Yt=!1;function Wf(e,t){switch(e){case"compositionend":return Ru(t);case"keypress":return t.which!==32?null:(Da=!0,Ma);case"textInput":return e=t.data,e===Ma&&Da?null:e;default:return null}}function Vf(e,t){if(Yt)return e==="compositionend"||!Oi&&Pu(e,t)?(e=ju(),Br=Li=ct=null,Yt=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Nu&&t.locale!=="ko"?null:t.data;default:return null}}var Qf={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Ia(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Qf[e.type]:t==="textarea"}function zu(e,t,n,r){iu(r),t=ll(t,"onChange"),0<t.length&&(n=new Ti("onChange","change",null,n,r),e.push({event:n,listeners:t}))}var Un=null,Jn=null;function Yf(e){Bu(e,0)}function Pl(e){var t=Xt(e);if(qs(t))return e}function Kf(e,t){if(e==="change")return t}var _u=!1;if(qe){var eo;if(qe){var to="oninput"in document;if(!to){var Aa=document.createElement("div");Aa.setAttribute("oninput","return;"),to=typeof Aa.oninput=="function"}eo=to}else eo=!1;_u=eo&&(!document.documentMode||9<document.documentMode)}function Ua(){Un&&(Un.detachEvent("onpropertychange",Lu),Jn=Un=null)}function Lu(e){if(e.propertyName==="value"&&Pl(Jn)){var t=[];zu(t,Jn,e,Ni(e)),cu(Yf,t)}}function Gf(e,t,n){e==="focusin"?(Ua(),Un=t,Jn=n,Un.attachEvent("onpropertychange",Lu)):e==="focusout"&&Ua()}function Xf(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Pl(Jn)}function bf(e,t){if(e==="click")return Pl(t)}function Jf(e,t){if(e==="input"||e==="change")return Pl(t)}function Zf(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Ae=typeof Object.is=="function"?Object.is:Zf;function Zn(e,t){if(Ae(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var l=n[r];if(!So.call(t,l)||!Ae(e[l],t[l]))return!1}return!0}function Ba(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function $a(e,t){var n=Ba(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=Ba(n)}}function Tu(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Tu(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Fu(){for(var e=window,t=Jr();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=Jr(e.document)}return t}function Mi(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function qf(e){var t=Fu(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&Tu(n.ownerDocument.documentElement,n)){if(r!==null&&Mi(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),"selectionStart"in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var l=n.textContent.length,o=Math.min(r.start,l);r=r.end===void 0?o:Math.min(r.end,l),!e.extend&&o>r&&(l=r,r=o,o=l),l=$a(n,o);var i=$a(n,r);l&&i&&(e.rangeCount!==1||e.anchorNode!==l.node||e.anchorOffset!==l.offset||e.focusNode!==i.node||e.focusOffset!==i.offset)&&(t=t.createRange(),t.setStart(l.node,l.offset),e.removeAllRanges(),o>r?(e.addRange(t),e.extend(i.node,i.offset)):(t.setEnd(i.node,i.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var ep=qe&&"documentMode"in document&&11>=document.documentMode,Kt=null,$o=null,Bn=null,Ho=!1;function Ha(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Ho||Kt==null||Kt!==Jr(r)||(r=Kt,"selectionStart"in r&&Mi(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Bn&&Zn(Bn,r)||(Bn=r,r=ll($o,"onSelect"),0<r.length&&(t=new Ti("onSelect","select",null,t,n),e.push({event:t,listeners:r}),t.target=Kt)))}function Pr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Gt={animationend:Pr("Animation","AnimationEnd"),animationiteration:Pr("Animation","AnimationIteration"),animationstart:Pr("Animation","AnimationStart"),transitionend:Pr("Transition","TransitionEnd")},no={},Ou={};qe&&(Ou=document.createElement("div").style,"AnimationEvent"in window||(delete Gt.animationend.animation,delete Gt.animationiteration.animation,delete Gt.animationstart.animation),"TransitionEvent"in window||delete Gt.transitionend.transition);function Rl(e){if(no[e])return no[e];if(!Gt[e])return e;var t=Gt[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Ou)return no[e]=t[n];return e}var Mu=Rl("animationend"),Du=Rl("animationiteration"),Iu=Rl("animationstart"),Au=Rl("transitionend"),Uu=new Map,Wa="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Et(e,t){Uu.set(e,t),Bt(t,[e])}for(var ro=0;ro<Wa.length;ro++){var lo=Wa[ro],tp=lo.toLowerCase(),np=lo[0].toUpperCase()+lo.slice(1);Et(tp,"on"+np)}Et(Mu,"onAnimationEnd");Et(Du,"onAnimationIteration");Et(Iu,"onAnimationStart");Et("dblclick","onDoubleClick");Et("focusin","onFocus");Et("focusout","onBlur");Et(Au,"onTransitionEnd");un("onMouseEnter",["mouseout","mouseover"]);un("onMouseLeave",["mouseout","mouseover"]);un("onPointerEnter",["pointerout","pointerover"]);un("onPointerLeave",["pointerout","pointerover"]);Bt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Bt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Bt("onBeforeInput",["compositionend","keypress","textInput","paste"]);Bt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Bt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Bt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Mn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),rp=new Set("cancel close invalid load scroll toggle".split(" ").concat(Mn));function Va(e,t,n){var r=e.type||"unknown-event";e.currentTarget=n,ef(r,t,void 0,e),e.currentTarget=null}function Bu(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var r=e[n],l=r.event;r=r.listeners;e:{var o=void 0;if(t)for(var i=r.length-1;0<=i;i--){var a=r[i],s=a.instance,c=a.currentTarget;if(a=a.listener,s!==o&&l.isPropagationStopped())break e;Va(l,a,c),o=s}else for(i=0;i<r.length;i++){if(a=r[i],s=a.instance,c=a.currentTarget,a=a.listener,s!==o&&l.isPropagationStopped())break e;Va(l,a,c),o=s}}}if(qr)throw e=Io,qr=!1,Io=null,e}function A(e,t){var n=t[Ko];n===void 0&&(n=t[Ko]=new Set);var r=e+"__bubble";n.has(r)||($u(t,e,2,!1),n.add(r))}function oo(e,t,n){var r=0;t&&(r|=4),$u(n,e,r,t)}var Rr="_reactListening"+Math.random().toString(36).slice(2);function qn(e){if(!e[Rr]){e[Rr]=!0,Gs.forEach(function(n){n!=="selectionchange"&&(rp.has(n)||oo(n,!1,e),oo(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Rr]||(t[Rr]=!0,oo("selectionchange",!1,t))}}function $u(e,t,n,r){switch(Cu(t)){case 1:var l=vf;break;case 4:l=yf;break;default:l=_i}n=l.bind(null,t,n,e),l=void 0,!Do||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(l=!0),r?l!==void 0?e.addEventListener(t,n,{capture:!0,passive:l}):e.addEventListener(t,n,!0):l!==void 0?e.addEventListener(t,n,{passive:l}):e.addEventListener(t,n,!1)}function io(e,t,n,r,l){var o=r;if(!(t&1)&&!(t&2)&&r!==null)e:for(;;){if(r===null)return;var i=r.tag;if(i===3||i===4){var a=r.stateNode.containerInfo;if(a===l||a.nodeType===8&&a.parentNode===l)break;if(i===4)for(i=r.return;i!==null;){var s=i.tag;if((s===3||s===4)&&(s=i.stateNode.containerInfo,s===l||s.nodeType===8&&s.parentNode===l))return;i=i.return}for(;a!==null;){if(i=_t(a),i===null)return;if(s=i.tag,s===5||s===6){r=o=i;continue e}a=a.parentNode}}r=r.return}cu(function(){var c=o,m=Ni(n),h=[];e:{var g=Uu.get(e);if(g!==void 0){var y=Ti,x=e;switch(e){case"keypress":if($r(n)===0)break e;case"keydown":case"keyup":y=Ff;break;case"focusin":x="focus",y=ql;break;case"focusout":x="blur",y=ql;break;case"beforeblur":case"afterblur":y=ql;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":y=Ta;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":y=kf;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":y=Df;break;case Mu:case Du:case Iu:y=Cf;break;case Au:y=Af;break;case"scroll":y=xf;break;case"wheel":y=Bf;break;case"copy":case"cut":case"paste":y=Nf;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":y=Oa}var k=(t&4)!==0,C=!k&&e==="scroll",f=k?g!==null?g+"Capture":null:g;k=[];for(var d=c,p;d!==null;){p=d;var w=p.stateNode;if(p.tag===5&&w!==null&&(p=w,f!==null&&(w=Kn(d,f),w!=null&&k.push(er(d,w,p)))),C)break;d=d.return}0<k.length&&(g=new y(g,x,null,n,m),h.push({event:g,listeners:k}))}}if(!(t&7)){e:{if(g=e==="mouseover"||e==="pointerover",y=e==="mouseout"||e==="pointerout",g&&n!==Oo&&(x=n.relatedTarget||n.fromElement)&&(_t(x)||x[et]))break e;if((y||g)&&(g=m.window===m?m:(g=m.ownerDocument)?g.defaultView||g.parentWindow:window,y?(x=n.relatedTarget||n.toElement,y=c,x=x?_t(x):null,x!==null&&(C=$t(x),x!==C||x.tag!==5&&x.tag!==6)&&(x=null)):(y=null,x=c),y!==x)){if(k=Ta,w="onMouseLeave",f="onMouseEnter",d="mouse",(e==="pointerout"||e==="pointerover")&&(k=Oa,w="onPointerLeave",f="onPointerEnter",d="pointer"),C=y==null?g:Xt(y),p=x==null?g:Xt(x),g=new k(w,d+"leave",y,n,m),g.target=C,g.relatedTarget=p,w=null,_t(m)===c&&(k=new k(f,d+"enter",x,n,m),k.target=p,k.relatedTarget=C,w=k),C=w,y&&x)t:{for(k=y,f=x,d=0,p=k;p;p=Wt(p))d++;for(p=0,w=f;w;w=Wt(w))p++;for(;0<d-p;)k=Wt(k),d--;for(;0<p-d;)f=Wt(f),p--;for(;d--;){if(k===f||f!==null&&k===f.alternate)break t;k=Wt(k),f=Wt(f)}k=null}else k=null;y!==null&&Qa(h,g,y,k,!1),x!==null&&C!==null&&Qa(h,C,x,k,!0)}}e:{if(g=c?Xt(c):window,y=g.nodeName&&g.nodeName.toLowerCase(),y==="select"||y==="input"&&g.type==="file")var E=Kf;else if(Ia(g))if(_u)E=Jf;else{E=Xf;var j=Gf}else(y=g.nodeName)&&y.toLowerCase()==="input"&&(g.type==="checkbox"||g.type==="radio")&&(E=bf);if(E&&(E=E(e,c))){zu(h,E,n,m);break e}j&&j(e,g,c),e==="focusout"&&(j=g._wrapperState)&&j.controlled&&g.type==="number"&&zo(g,"number",g.value)}switch(j=c?Xt(c):window,e){case"focusin":(Ia(j)||j.contentEditable==="true")&&(Kt=j,$o=c,Bn=null);break;case"focusout":Bn=$o=Kt=null;break;case"mousedown":Ho=!0;break;case"contextmenu":case"mouseup":case"dragend":Ho=!1,Ha(h,n,m);break;case"selectionchange":if(ep)break;case"keydown":case"keyup":Ha(h,n,m)}var P;if(Oi)e:{switch(e){case"compositionstart":var z="onCompositionStart";break e;case"compositionend":z="onCompositionEnd";break e;case"compositionupdate":z="onCompositionUpdate";break e}z=void 0}else Yt?Pu(e,n)&&(z="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(z="onCompositionStart");z&&(Nu&&n.locale!=="ko"&&(Yt||z!=="onCompositionStart"?z==="onCompositionEnd"&&Yt&&(P=ju()):(ct=m,Li="value"in ct?ct.value:ct.textContent,Yt=!0)),j=ll(c,z),0<j.length&&(z=new Fa(z,e,null,n,m),h.push({event:z,listeners:j}),P?z.data=P:(P=Ru(n),P!==null&&(z.data=P)))),(P=Hf?Wf(e,n):Vf(e,n))&&(c=ll(c,"onBeforeInput"),0<c.length&&(m=new Fa("onBeforeInput","beforeinput",null,n,m),h.push({event:m,listeners:c}),m.data=P))}Bu(h,t)})}function er(e,t,n){return{instance:e,listener:t,currentTarget:n}}function ll(e,t){for(var n=t+"Capture",r=[];e!==null;){var l=e,o=l.stateNode;l.tag===5&&o!==null&&(l=o,o=Kn(e,n),o!=null&&r.unshift(er(e,o,l)),o=Kn(e,t),o!=null&&r.push(er(e,o,l))),e=e.return}return r}function Wt(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Qa(e,t,n,r,l){for(var o=t._reactName,i=[];n!==null&&n!==r;){var a=n,s=a.alternate,c=a.stateNode;if(s!==null&&s===r)break;a.tag===5&&c!==null&&(a=c,l?(s=Kn(n,o),s!=null&&i.unshift(er(n,s,a))):l||(s=Kn(n,o),s!=null&&i.push(er(n,s,a)))),n=n.return}i.length!==0&&e.push({event:t,listeners:i})}var lp=/\r\n?/g,op=/\u0000|\uFFFD/g;function Ya(e){return(typeof e=="string"?e:""+e).replace(lp,`
`).replace(op,"")}function zr(e,t,n){if(t=Ya(t),Ya(e)!==t&&n)throw Error(S(425))}function ol(){}var Wo=null,Vo=null;function Qo(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Yo=typeof setTimeout=="function"?setTimeout:void 0,ip=typeof clearTimeout=="function"?clearTimeout:void 0,Ka=typeof Promise=="function"?Promise:void 0,ap=typeof queueMicrotask=="function"?queueMicrotask:typeof Ka<"u"?function(e){return Ka.resolve(null).then(e).catch(sp)}:Yo;function sp(e){setTimeout(function(){throw e})}function ao(e,t){var n=t,r=0;do{var l=n.nextSibling;if(e.removeChild(n),l&&l.nodeType===8)if(n=l.data,n==="/$"){if(r===0){e.removeChild(l),bn(t);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=l}while(n);bn(t)}function gt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function Ga(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}var yn=Math.random().toString(36).slice(2),He="__reactFiber$"+yn,tr="__reactProps$"+yn,et="__reactContainer$"+yn,Ko="__reactEvents$"+yn,up="__reactListeners$"+yn,cp="__reactHandles$"+yn;function _t(e){var t=e[He];if(t)return t;for(var n=e.parentNode;n;){if(t=n[et]||n[He]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Ga(e);e!==null;){if(n=e[He])return n;e=Ga(e)}return t}e=n,n=e.parentNode}return null}function fr(e){return e=e[He]||e[et],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Xt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(S(33))}function zl(e){return e[tr]||null}var Go=[],bt=-1;function Ct(e){return{current:e}}function U(e){0>bt||(e.current=Go[bt],Go[bt]=null,bt--)}function I(e,t){bt++,Go[bt]=e.current,e.current=t}var St={},ie=Ct(St),he=Ct(!1),Mt=St;function cn(e,t){var n=e.type.contextTypes;if(!n)return St;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var l={},o;for(o in n)l[o]=t[o];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=l),l}function me(e){return e=e.childContextTypes,e!=null}function il(){U(he),U(ie)}function Xa(e,t,n){if(ie.current!==St)throw Error(S(168));I(ie,t),I(he,n)}function Hu(e,t,n){var r=e.stateNode;if(t=t.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var l in r)if(!(l in t))throw Error(S(108,Kd(e)||"Unknown",l));return V({},n,r)}function al(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||St,Mt=ie.current,I(ie,e),I(he,he.current),!0}function ba(e,t,n){var r=e.stateNode;if(!r)throw Error(S(169));n?(e=Hu(e,t,Mt),r.__reactInternalMemoizedMergedChildContext=e,U(he),U(ie),I(ie,e)):U(he),I(he,n)}var Ge=null,_l=!1,so=!1;function Wu(e){Ge===null?Ge=[e]:Ge.push(e)}function dp(e){_l=!0,Wu(e)}function jt(){if(!so&&Ge!==null){so=!0;var e=0,t=M;try{var n=Ge;for(M=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}Ge=null,_l=!1}catch(l){throw Ge!==null&&(Ge=Ge.slice(e+1)),hu(Pi,jt),l}finally{M=t,so=!1}}return null}var Jt=[],Zt=0,sl=null,ul=0,Ce=[],je=0,Dt=null,Xe=1,be="";function Rt(e,t){Jt[Zt++]=ul,Jt[Zt++]=sl,sl=e,ul=t}function Vu(e,t,n){Ce[je++]=Xe,Ce[je++]=be,Ce[je++]=Dt,Dt=e;var r=Xe;e=be;var l=32-De(r)-1;r&=~(1<<l),n+=1;var o=32-De(t)+l;if(30<o){var i=l-l%5;o=(r&(1<<i)-1).toString(32),r>>=i,l-=i,Xe=1<<32-De(t)+l|n<<l|r,be=o+e}else Xe=1<<o|n<<l|r,be=e}function Di(e){e.return!==null&&(Rt(e,1),Vu(e,1,0))}function Ii(e){for(;e===sl;)sl=Jt[--Zt],Jt[Zt]=null,ul=Jt[--Zt],Jt[Zt]=null;for(;e===Dt;)Dt=Ce[--je],Ce[je]=null,be=Ce[--je],Ce[je]=null,Xe=Ce[--je],Ce[je]=null}var we=null,xe=null,B=!1,Me=null;function Qu(e,t){var n=Ne(5,null,null,0);n.elementType="DELETED",n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function Ja(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,we=e,xe=gt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,we=e,xe=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(n=Dt!==null?{id:Xe,overflow:be}:null,e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=Ne(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,we=e,xe=null,!0):!1;default:return!1}}function Xo(e){return(e.mode&1)!==0&&(e.flags&128)===0}function bo(e){if(B){var t=xe;if(t){var n=t;if(!Ja(e,t)){if(Xo(e))throw Error(S(418));t=gt(n.nextSibling);var r=we;t&&Ja(e,t)?Qu(r,n):(e.flags=e.flags&-4097|2,B=!1,we=e)}}else{if(Xo(e))throw Error(S(418));e.flags=e.flags&-4097|2,B=!1,we=e}}}function Za(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;we=e}function _r(e){if(e!==we)return!1;if(!B)return Za(e),B=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!Qo(e.type,e.memoizedProps)),t&&(t=xe)){if(Xo(e))throw Yu(),Error(S(418));for(;t;)Qu(e,t),t=gt(t.nextSibling)}if(Za(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(S(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"){if(t===0){xe=gt(e.nextSibling);break e}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++}e=e.nextSibling}xe=null}}else xe=we?gt(e.stateNode.nextSibling):null;return!0}function Yu(){for(var e=xe;e;)e=gt(e.nextSibling)}function dn(){xe=we=null,B=!1}function Ai(e){Me===null?Me=[e]:Me.push(e)}var fp=lt.ReactCurrentBatchConfig;function Rn(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(S(309));var r=n.stateNode}if(!r)throw Error(S(147,e));var l=r,o=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===o?t.ref:(t=function(i){var a=l.refs;i===null?delete a[o]:a[o]=i},t._stringRef=o,t)}if(typeof e!="string")throw Error(S(284));if(!n._owner)throw Error(S(290,e))}return e}function Lr(e,t){throw e=Object.prototype.toString.call(t),Error(S(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function qa(e){var t=e._init;return t(e._payload)}function Ku(e){function t(f,d){if(e){var p=f.deletions;p===null?(f.deletions=[d],f.flags|=16):p.push(d)}}function n(f,d){if(!e)return null;for(;d!==null;)t(f,d),d=d.sibling;return null}function r(f,d){for(f=new Map;d!==null;)d.key!==null?f.set(d.key,d):f.set(d.index,d),d=d.sibling;return f}function l(f,d){return f=wt(f,d),f.index=0,f.sibling=null,f}function o(f,d,p){return f.index=p,e?(p=f.alternate,p!==null?(p=p.index,p<d?(f.flags|=2,d):p):(f.flags|=2,d)):(f.flags|=1048576,d)}function i(f){return e&&f.alternate===null&&(f.flags|=2),f}function a(f,d,p,w){return d===null||d.tag!==6?(d=go(p,f.mode,w),d.return=f,d):(d=l(d,p),d.return=f,d)}function s(f,d,p,w){var E=p.type;return E===Qt?m(f,d,p.props.children,w,p.key):d!==null&&(d.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===it&&qa(E)===d.type)?(w=l(d,p.props),w.ref=Rn(f,d,p),w.return=f,w):(w=Gr(p.type,p.key,p.props,null,f.mode,w),w.ref=Rn(f,d,p),w.return=f,w)}function c(f,d,p,w){return d===null||d.tag!==4||d.stateNode.containerInfo!==p.containerInfo||d.stateNode.implementation!==p.implementation?(d=vo(p,f.mode,w),d.return=f,d):(d=l(d,p.children||[]),d.return=f,d)}function m(f,d,p,w,E){return d===null||d.tag!==7?(d=Ot(p,f.mode,w,E),d.return=f,d):(d=l(d,p),d.return=f,d)}function h(f,d,p){if(typeof d=="string"&&d!==""||typeof d=="number")return d=go(""+d,f.mode,p),d.return=f,d;if(typeof d=="object"&&d!==null){switch(d.$$typeof){case wr:return p=Gr(d.type,d.key,d.props,null,f.mode,p),p.ref=Rn(f,null,d),p.return=f,p;case Vt:return d=vo(d,f.mode,p),d.return=f,d;case it:var w=d._init;return h(f,w(d._payload),p)}if(Fn(d)||En(d))return d=Ot(d,f.mode,p,null),d.return=f,d;Lr(f,d)}return null}function g(f,d,p,w){var E=d!==null?d.key:null;if(typeof p=="string"&&p!==""||typeof p=="number")return E!==null?null:a(f,d,""+p,w);if(typeof p=="object"&&p!==null){switch(p.$$typeof){case wr:return p.key===E?s(f,d,p,w):null;case Vt:return p.key===E?c(f,d,p,w):null;case it:return E=p._init,g(f,d,E(p._payload),w)}if(Fn(p)||En(p))return E!==null?null:m(f,d,p,w,null);Lr(f,p)}return null}function y(f,d,p,w,E){if(typeof w=="string"&&w!==""||typeof w=="number")return f=f.get(p)||null,a(d,f,""+w,E);if(typeof w=="object"&&w!==null){switch(w.$$typeof){case wr:return f=f.get(w.key===null?p:w.key)||null,s(d,f,w,E);case Vt:return f=f.get(w.key===null?p:w.key)||null,c(d,f,w,E);case it:var j=w._init;return y(f,d,p,j(w._payload),E)}if(Fn(w)||En(w))return f=f.get(p)||null,m(d,f,w,E,null);Lr(d,w)}return null}function x(f,d,p,w){for(var E=null,j=null,P=d,z=d=0,D=null;P!==null&&z<p.length;z++){P.index>z?(D=P,P=null):D=P.sibling;var _=g(f,P,p[z],w);if(_===null){P===null&&(P=D);break}e&&P&&_.alternate===null&&t(f,P),d=o(_,d,z),j===null?E=_:j.sibling=_,j=_,P=D}if(z===p.length)return n(f,P),B&&Rt(f,z),E;if(P===null){for(;z<p.length;z++)P=h(f,p[z],w),P!==null&&(d=o(P,d,z),j===null?E=P:j.sibling=P,j=P);return B&&Rt(f,z),E}for(P=r(f,P);z<p.length;z++)D=y(P,f,z,p[z],w),D!==null&&(e&&D.alternate!==null&&P.delete(D.key===null?z:D.key),d=o(D,d,z),j===null?E=D:j.sibling=D,j=D);return e&&P.forEach(function(Le){return t(f,Le)}),B&&Rt(f,z),E}function k(f,d,p,w){var E=En(p);if(typeof E!="function")throw Error(S(150));if(p=E.call(p),p==null)throw Error(S(151));for(var j=E=null,P=d,z=d=0,D=null,_=p.next();P!==null&&!_.done;z++,_=p.next()){P.index>z?(D=P,P=null):D=P.sibling;var Le=g(f,P,_.value,w);if(Le===null){P===null&&(P=D);break}e&&P&&Le.alternate===null&&t(f,P),d=o(Le,d,z),j===null?E=Le:j.sibling=Le,j=Le,P=D}if(_.done)return n(f,P),B&&Rt(f,z),E;if(P===null){for(;!_.done;z++,_=p.next())_=h(f,_.value,w),_!==null&&(d=o(_,d,z),j===null?E=_:j.sibling=_,j=_);return B&&Rt(f,z),E}for(P=r(f,P);!_.done;z++,_=p.next())_=y(P,f,z,_.value,w),_!==null&&(e&&_.alternate!==null&&P.delete(_.key===null?z:_.key),d=o(_,d,z),j===null?E=_:j.sibling=_,j=_);return e&&P.forEach(function(kn){return t(f,kn)}),B&&Rt(f,z),E}function C(f,d,p,w){if(typeof p=="object"&&p!==null&&p.type===Qt&&p.key===null&&(p=p.props.children),typeof p=="object"&&p!==null){switch(p.$$typeof){case wr:e:{for(var E=p.key,j=d;j!==null;){if(j.key===E){if(E=p.type,E===Qt){if(j.tag===7){n(f,j.sibling),d=l(j,p.props.children),d.return=f,f=d;break e}}else if(j.elementType===E||typeof E=="object"&&E!==null&&E.$$typeof===it&&qa(E)===j.type){n(f,j.sibling),d=l(j,p.props),d.ref=Rn(f,j,p),d.return=f,f=d;break e}n(f,j);break}else t(f,j);j=j.sibling}p.type===Qt?(d=Ot(p.props.children,f.mode,w,p.key),d.return=f,f=d):(w=Gr(p.type,p.key,p.props,null,f.mode,w),w.ref=Rn(f,d,p),w.return=f,f=w)}return i(f);case Vt:e:{for(j=p.key;d!==null;){if(d.key===j)if(d.tag===4&&d.stateNode.containerInfo===p.containerInfo&&d.stateNode.implementation===p.implementation){n(f,d.sibling),d=l(d,p.children||[]),d.return=f,f=d;break e}else{n(f,d);break}else t(f,d);d=d.sibling}d=vo(p,f.mode,w),d.return=f,f=d}return i(f);case it:return j=p._init,C(f,d,j(p._payload),w)}if(Fn(p))return x(f,d,p,w);if(En(p))return k(f,d,p,w);Lr(f,p)}return typeof p=="string"&&p!==""||typeof p=="number"?(p=""+p,d!==null&&d.tag===6?(n(f,d.sibling),d=l(d,p),d.return=f,f=d):(n(f,d),d=go(p,f.mode,w),d.return=f,f=d),i(f)):n(f,d)}return C}var fn=Ku(!0),Gu=Ku(!1),cl=Ct(null),dl=null,qt=null,Ui=null;function Bi(){Ui=qt=dl=null}function $i(e){var t=cl.current;U(cl),e._currentValue=t}function Jo(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,r!==null&&(r.childLanes|=t)):r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t),e===n)break;e=e.return}}function an(e,t){dl=e,Ui=qt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&(e.lanes&t&&(pe=!0),e.firstContext=null)}function Re(e){var t=e._currentValue;if(Ui!==e)if(e={context:e,memoizedValue:t,next:null},qt===null){if(dl===null)throw Error(S(308));qt=e,dl.dependencies={lanes:0,firstContext:e}}else qt=qt.next=e;return t}var Lt=null;function Hi(e){Lt===null?Lt=[e]:Lt.push(e)}function Xu(e,t,n,r){var l=t.interleaved;return l===null?(n.next=n,Hi(t)):(n.next=l.next,l.next=n),t.interleaved=n,tt(e,r)}function tt(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var at=!1;function Wi(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function bu(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Je(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function vt(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,O&2){var l=r.pending;return l===null?t.next=t:(t.next=l.next,l.next=t),r.pending=t,tt(e,n)}return l=r.interleaved,l===null?(t.next=t,Hi(r)):(t.next=l.next,l.next=t),r.interleaved=t,tt(e,n)}function Hr(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194240)!==0)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Ri(e,n)}}function es(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var l=null,o=null;if(n=n.firstBaseUpdate,n!==null){do{var i={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};o===null?l=o=i:o=o.next=i,n=n.next}while(n!==null);o===null?l=o=t:o=o.next=t}else l=o=t;n={baseState:r.baseState,firstBaseUpdate:l,lastBaseUpdate:o,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function fl(e,t,n,r){var l=e.updateQueue;at=!1;var o=l.firstBaseUpdate,i=l.lastBaseUpdate,a=l.shared.pending;if(a!==null){l.shared.pending=null;var s=a,c=s.next;s.next=null,i===null?o=c:i.next=c,i=s;var m=e.alternate;m!==null&&(m=m.updateQueue,a=m.lastBaseUpdate,a!==i&&(a===null?m.firstBaseUpdate=c:a.next=c,m.lastBaseUpdate=s))}if(o!==null){var h=l.baseState;i=0,m=c=s=null,a=o;do{var g=a.lane,y=a.eventTime;if((r&g)===g){m!==null&&(m=m.next={eventTime:y,lane:0,tag:a.tag,payload:a.payload,callback:a.callback,next:null});e:{var x=e,k=a;switch(g=t,y=n,k.tag){case 1:if(x=k.payload,typeof x=="function"){h=x.call(y,h,g);break e}h=x;break e;case 3:x.flags=x.flags&-65537|128;case 0:if(x=k.payload,g=typeof x=="function"?x.call(y,h,g):x,g==null)break e;h=V({},h,g);break e;case 2:at=!0}}a.callback!==null&&a.lane!==0&&(e.flags|=64,g=l.effects,g===null?l.effects=[a]:g.push(a))}else y={eventTime:y,lane:g,tag:a.tag,payload:a.payload,callback:a.callback,next:null},m===null?(c=m=y,s=h):m=m.next=y,i|=g;if(a=a.next,a===null){if(a=l.shared.pending,a===null)break;g=a,a=g.next,g.next=null,l.lastBaseUpdate=g,l.shared.pending=null}}while(!0);if(m===null&&(s=h),l.baseState=s,l.firstBaseUpdate=c,l.lastBaseUpdate=m,t=l.shared.interleaved,t!==null){l=t;do i|=l.lane,l=l.next;while(l!==t)}else o===null&&(l.shared.lanes=0);At|=i,e.lanes=i,e.memoizedState=h}}function ts(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var r=e[t],l=r.callback;if(l!==null){if(r.callback=null,r=n,typeof l!="function")throw Error(S(191,l));l.call(r)}}}var pr={},Ve=Ct(pr),nr=Ct(pr),rr=Ct(pr);function Tt(e){if(e===pr)throw Error(S(174));return e}function Vi(e,t){switch(I(rr,t),I(nr,e),I(Ve,pr),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:Lo(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=Lo(t,e)}U(Ve),I(Ve,t)}function pn(){U(Ve),U(nr),U(rr)}function Ju(e){Tt(rr.current);var t=Tt(Ve.current),n=Lo(t,e.type);t!==n&&(I(nr,e),I(Ve,n))}function Qi(e){nr.current===e&&(U(Ve),U(nr))}var $=Ct(0);function pl(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if(t.flags&128)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var uo=[];function Yi(){for(var e=0;e<uo.length;e++)uo[e]._workInProgressVersionPrimary=null;uo.length=0}var Wr=lt.ReactCurrentDispatcher,co=lt.ReactCurrentBatchConfig,It=0,H=null,X=null,Z=null,hl=!1,$n=!1,lr=0,pp=0;function re(){throw Error(S(321))}function Ki(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!Ae(e[n],t[n]))return!1;return!0}function Gi(e,t,n,r,l,o){if(It=o,H=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Wr.current=e===null||e.memoizedState===null?vp:yp,e=n(r,l),$n){o=0;do{if($n=!1,lr=0,25<=o)throw Error(S(301));o+=1,Z=X=null,t.updateQueue=null,Wr.current=xp,e=n(r,l)}while($n)}if(Wr.current=ml,t=X!==null&&X.next!==null,It=0,Z=X=H=null,hl=!1,t)throw Error(S(300));return e}function Xi(){var e=lr!==0;return lr=0,e}function $e(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Z===null?H.memoizedState=Z=e:Z=Z.next=e,Z}function ze(){if(X===null){var e=H.alternate;e=e!==null?e.memoizedState:null}else e=X.next;var t=Z===null?H.memoizedState:Z.next;if(t!==null)Z=t,X=e;else{if(e===null)throw Error(S(310));X=e,e={memoizedState:X.memoizedState,baseState:X.baseState,baseQueue:X.baseQueue,queue:X.queue,next:null},Z===null?H.memoizedState=Z=e:Z=Z.next=e}return Z}function or(e,t){return typeof t=="function"?t(e):t}function fo(e){var t=ze(),n=t.queue;if(n===null)throw Error(S(311));n.lastRenderedReducer=e;var r=X,l=r.baseQueue,o=n.pending;if(o!==null){if(l!==null){var i=l.next;l.next=o.next,o.next=i}r.baseQueue=l=o,n.pending=null}if(l!==null){o=l.next,r=r.baseState;var a=i=null,s=null,c=o;do{var m=c.lane;if((It&m)===m)s!==null&&(s=s.next={lane:0,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),r=c.hasEagerState?c.eagerState:e(r,c.action);else{var h={lane:m,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null};s===null?(a=s=h,i=r):s=s.next=h,H.lanes|=m,At|=m}c=c.next}while(c!==null&&c!==o);s===null?i=r:s.next=a,Ae(r,t.memoizedState)||(pe=!0),t.memoizedState=r,t.baseState=i,t.baseQueue=s,n.lastRenderedState=r}if(e=n.interleaved,e!==null){l=e;do o=l.lane,H.lanes|=o,At|=o,l=l.next;while(l!==e)}else l===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function po(e){var t=ze(),n=t.queue;if(n===null)throw Error(S(311));n.lastRenderedReducer=e;var r=n.dispatch,l=n.pending,o=t.memoizedState;if(l!==null){n.pending=null;var i=l=l.next;do o=e(o,i.action),i=i.next;while(i!==l);Ae(o,t.memoizedState)||(pe=!0),t.memoizedState=o,t.baseQueue===null&&(t.baseState=o),n.lastRenderedState=o}return[o,r]}function Zu(){}function qu(e,t){var n=H,r=ze(),l=t(),o=!Ae(r.memoizedState,l);if(o&&(r.memoizedState=l,pe=!0),r=r.queue,bi(nc.bind(null,n,r,e),[e]),r.getSnapshot!==t||o||Z!==null&&Z.memoizedState.tag&1){if(n.flags|=2048,ir(9,tc.bind(null,n,r,l,t),void 0,null),q===null)throw Error(S(349));It&30||ec(n,t,l)}return l}function ec(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=H.updateQueue,t===null?(t={lastEffect:null,stores:null},H.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function tc(e,t,n,r){t.value=n,t.getSnapshot=r,rc(t)&&lc(e)}function nc(e,t,n){return n(function(){rc(t)&&lc(e)})}function rc(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!Ae(e,n)}catch{return!0}}function lc(e){var t=tt(e,1);t!==null&&Ie(t,e,1,-1)}function ns(e){var t=$e();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:or,lastRenderedState:e},t.queue=e,e=e.dispatch=gp.bind(null,H,e),[t.memoizedState,e]}function ir(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=H.updateQueue,t===null?(t={lastEffect:null,stores:null},H.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function oc(){return ze().memoizedState}function Vr(e,t,n,r){var l=$e();H.flags|=e,l.memoizedState=ir(1|t,n,void 0,r===void 0?null:r)}function Ll(e,t,n,r){var l=ze();r=r===void 0?null:r;var o=void 0;if(X!==null){var i=X.memoizedState;if(o=i.destroy,r!==null&&Ki(r,i.deps)){l.memoizedState=ir(t,n,o,r);return}}H.flags|=e,l.memoizedState=ir(1|t,n,o,r)}function rs(e,t){return Vr(8390656,8,e,t)}function bi(e,t){return Ll(2048,8,e,t)}function ic(e,t){return Ll(4,2,e,t)}function ac(e,t){return Ll(4,4,e,t)}function sc(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function uc(e,t,n){return n=n!=null?n.concat([e]):null,Ll(4,4,sc.bind(null,t,e),n)}function Ji(){}function cc(e,t){var n=ze();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Ki(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function dc(e,t){var n=ze();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&Ki(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function fc(e,t,n){return It&21?(Ae(n,t)||(n=vu(),H.lanes|=n,At|=n,e.baseState=!0),t):(e.baseState&&(e.baseState=!1,pe=!0),e.memoizedState=n)}function hp(e,t){var n=M;M=n!==0&&4>n?n:4,e(!0);var r=co.transition;co.transition={};try{e(!1),t()}finally{M=n,co.transition=r}}function pc(){return ze().memoizedState}function mp(e,t,n){var r=xt(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},hc(e))mc(t,n);else if(n=Xu(e,t,n,r),n!==null){var l=se();Ie(n,e,r,l),gc(n,t,r)}}function gp(e,t,n){var r=xt(e),l={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(hc(e))mc(t,l);else{var o=e.alternate;if(e.lanes===0&&(o===null||o.lanes===0)&&(o=t.lastRenderedReducer,o!==null))try{var i=t.lastRenderedState,a=o(i,n);if(l.hasEagerState=!0,l.eagerState=a,Ae(a,i)){var s=t.interleaved;s===null?(l.next=l,Hi(t)):(l.next=s.next,s.next=l),t.interleaved=l;return}}catch{}finally{}n=Xu(e,t,l,r),n!==null&&(l=se(),Ie(n,e,r,l),gc(n,t,r))}}function hc(e){var t=e.alternate;return e===H||t!==null&&t===H}function mc(e,t){$n=hl=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function gc(e,t,n){if(n&4194240){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,Ri(e,n)}}var ml={readContext:Re,useCallback:re,useContext:re,useEffect:re,useImperativeHandle:re,useInsertionEffect:re,useLayoutEffect:re,useMemo:re,useReducer:re,useRef:re,useState:re,useDebugValue:re,useDeferredValue:re,useTransition:re,useMutableSource:re,useSyncExternalStore:re,useId:re,unstable_isNewReconciler:!1},vp={readContext:Re,useCallback:function(e,t){return $e().memoizedState=[e,t===void 0?null:t],e},useContext:Re,useEffect:rs,useImperativeHandle:function(e,t,n){return n=n!=null?n.concat([e]):null,Vr(4194308,4,sc.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Vr(4194308,4,e,t)},useInsertionEffect:function(e,t){return Vr(4,2,e,t)},useMemo:function(e,t){var n=$e();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=$e();return t=n!==void 0?n(t):t,r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=mp.bind(null,H,e),[r.memoizedState,e]},useRef:function(e){var t=$e();return e={current:e},t.memoizedState=e},useState:ns,useDebugValue:Ji,useDeferredValue:function(e){return $e().memoizedState=e},useTransition:function(){var e=ns(!1),t=e[0];return e=hp.bind(null,e[1]),$e().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var r=H,l=$e();if(B){if(n===void 0)throw Error(S(407));n=n()}else{if(n=t(),q===null)throw Error(S(349));It&30||ec(r,t,n)}l.memoizedState=n;var o={value:n,getSnapshot:t};return l.queue=o,rs(nc.bind(null,r,o,e),[e]),r.flags|=2048,ir(9,tc.bind(null,r,o,n,t),void 0,null),n},useId:function(){var e=$e(),t=q.identifierPrefix;if(B){var n=be,r=Xe;n=(r&~(1<<32-De(r)-1)).toString(32)+n,t=":"+t+"R"+n,n=lr++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=pp++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},yp={readContext:Re,useCallback:cc,useContext:Re,useEffect:bi,useImperativeHandle:uc,useInsertionEffect:ic,useLayoutEffect:ac,useMemo:dc,useReducer:fo,useRef:oc,useState:function(){return fo(or)},useDebugValue:Ji,useDeferredValue:function(e){var t=ze();return fc(t,X.memoizedState,e)},useTransition:function(){var e=fo(or)[0],t=ze().memoizedState;return[e,t]},useMutableSource:Zu,useSyncExternalStore:qu,useId:pc,unstable_isNewReconciler:!1},xp={readContext:Re,useCallback:cc,useContext:Re,useEffect:bi,useImperativeHandle:uc,useInsertionEffect:ic,useLayoutEffect:ac,useMemo:dc,useReducer:po,useRef:oc,useState:function(){return po(or)},useDebugValue:Ji,useDeferredValue:function(e){var t=ze();return X===null?t.memoizedState=e:fc(t,X.memoizedState,e)},useTransition:function(){var e=po(or)[0],t=ze().memoizedState;return[e,t]},useMutableSource:Zu,useSyncExternalStore:qu,useId:pc,unstable_isNewReconciler:!1};function Fe(e,t){if(e&&e.defaultProps){t=V({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function Zo(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:V({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Tl={isMounted:function(e){return(e=e._reactInternals)?$t(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=se(),l=xt(e),o=Je(r,l);o.payload=t,n!=null&&(o.callback=n),t=vt(e,o,l),t!==null&&(Ie(t,e,l,r),Hr(t,e,l))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=se(),l=xt(e),o=Je(r,l);o.tag=1,o.payload=t,n!=null&&(o.callback=n),t=vt(e,o,l),t!==null&&(Ie(t,e,l,r),Hr(t,e,l))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=se(),r=xt(e),l=Je(n,r);l.tag=2,t!=null&&(l.callback=t),t=vt(e,l,r),t!==null&&(Ie(t,e,r,n),Hr(t,e,r))}};function ls(e,t,n,r,l,o,i){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,o,i):t.prototype&&t.prototype.isPureReactComponent?!Zn(n,r)||!Zn(l,o):!0}function vc(e,t,n){var r=!1,l=St,o=t.contextType;return typeof o=="object"&&o!==null?o=Re(o):(l=me(t)?Mt:ie.current,r=t.contextTypes,o=(r=r!=null)?cn(e,l):St),t=new t(n,o),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=Tl,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=l,e.__reactInternalMemoizedMaskedChildContext=o),t}function os(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&Tl.enqueueReplaceState(t,t.state,null)}function qo(e,t,n,r){var l=e.stateNode;l.props=n,l.state=e.memoizedState,l.refs={},Wi(e);var o=t.contextType;typeof o=="object"&&o!==null?l.context=Re(o):(o=me(t)?Mt:ie.current,l.context=cn(e,o)),l.state=e.memoizedState,o=t.getDerivedStateFromProps,typeof o=="function"&&(Zo(e,t,o,n),l.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof l.getSnapshotBeforeUpdate=="function"||typeof l.UNSAFE_componentWillMount!="function"&&typeof l.componentWillMount!="function"||(t=l.state,typeof l.componentWillMount=="function"&&l.componentWillMount(),typeof l.UNSAFE_componentWillMount=="function"&&l.UNSAFE_componentWillMount(),t!==l.state&&Tl.enqueueReplaceState(l,l.state,null),fl(e,n,l,r),l.state=e.memoizedState),typeof l.componentDidMount=="function"&&(e.flags|=4194308)}function hn(e,t){try{var n="",r=t;do n+=Yd(r),r=r.return;while(r);var l=n}catch(o){l=`
Error generating stack: `+o.message+`
`+o.stack}return{value:e,source:t,stack:l,digest:null}}function ho(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function ei(e,t){try{console.error(t.value)}catch(n){setTimeout(function(){throw n})}}var wp=typeof WeakMap=="function"?WeakMap:Map;function yc(e,t,n){n=Je(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){vl||(vl=!0,ci=r),ei(e,t)},n}function xc(e,t,n){n=Je(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var l=t.value;n.payload=function(){return r(l)},n.callback=function(){ei(e,t)}}var o=e.stateNode;return o!==null&&typeof o.componentDidCatch=="function"&&(n.callback=function(){ei(e,t),typeof r!="function"&&(yt===null?yt=new Set([this]):yt.add(this));var i=t.stack;this.componentDidCatch(t.value,{componentStack:i!==null?i:""})}),n}function is(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new wp;var l=new Set;r.set(t,l)}else l=r.get(t),l===void 0&&(l=new Set,r.set(t,l));l.has(n)||(l.add(n),e=Op.bind(null,e,t,n),t.then(e,e))}function as(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function ss(e,t,n,r,l){return e.mode&1?(e.flags|=65536,e.lanes=l,e):(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=Je(-1,1),t.tag=2,vt(n,t,1))),n.lanes|=1),e)}var kp=lt.ReactCurrentOwner,pe=!1;function ae(e,t,n,r){t.child=e===null?Gu(t,null,n,r):fn(t,e.child,n,r)}function us(e,t,n,r,l){n=n.render;var o=t.ref;return an(t,l),r=Gi(e,t,n,r,o,l),n=Xi(),e!==null&&!pe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,nt(e,t,l)):(B&&n&&Di(t),t.flags|=1,ae(e,t,r,l),t.child)}function cs(e,t,n,r,l){if(e===null){var o=n.type;return typeof o=="function"&&!oa(o)&&o.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=o,wc(e,t,o,r,l)):(e=Gr(n.type,null,r,t,t.mode,l),e.ref=t.ref,e.return=t,t.child=e)}if(o=e.child,!(e.lanes&l)){var i=o.memoizedProps;if(n=n.compare,n=n!==null?n:Zn,n(i,r)&&e.ref===t.ref)return nt(e,t,l)}return t.flags|=1,e=wt(o,r),e.ref=t.ref,e.return=t,t.child=e}function wc(e,t,n,r,l){if(e!==null){var o=e.memoizedProps;if(Zn(o,r)&&e.ref===t.ref)if(pe=!1,t.pendingProps=r=o,(e.lanes&l)!==0)e.flags&131072&&(pe=!0);else return t.lanes=e.lanes,nt(e,t,l)}return ti(e,t,n,r,l)}function kc(e,t,n){var r=t.pendingProps,l=r.children,o=e!==null?e.memoizedState:null;if(r.mode==="hidden")if(!(t.mode&1))t.memoizedState={baseLanes:0,cachePool:null,transitions:null},I(tn,ye),ye|=n;else{if(!(n&1073741824))return e=o!==null?o.baseLanes|n:n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,I(tn,ye),ye|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=o!==null?o.baseLanes:n,I(tn,ye),ye|=r}else o!==null?(r=o.baseLanes|n,t.memoizedState=null):r=n,I(tn,ye),ye|=r;return ae(e,t,l,n),t.child}function Sc(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function ti(e,t,n,r,l){var o=me(n)?Mt:ie.current;return o=cn(t,o),an(t,l),n=Gi(e,t,n,r,o,l),r=Xi(),e!==null&&!pe?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~l,nt(e,t,l)):(B&&r&&Di(t),t.flags|=1,ae(e,t,n,l),t.child)}function ds(e,t,n,r,l){if(me(n)){var o=!0;al(t)}else o=!1;if(an(t,l),t.stateNode===null)Qr(e,t),vc(t,n,r),qo(t,n,r,l),r=!0;else if(e===null){var i=t.stateNode,a=t.memoizedProps;i.props=a;var s=i.context,c=n.contextType;typeof c=="object"&&c!==null?c=Re(c):(c=me(n)?Mt:ie.current,c=cn(t,c));var m=n.getDerivedStateFromProps,h=typeof m=="function"||typeof i.getSnapshotBeforeUpdate=="function";h||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(a!==r||s!==c)&&os(t,i,r,c),at=!1;var g=t.memoizedState;i.state=g,fl(t,r,i,l),s=t.memoizedState,a!==r||g!==s||he.current||at?(typeof m=="function"&&(Zo(t,n,m,r),s=t.memoizedState),(a=at||ls(t,n,a,r,g,s,c))?(h||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount()),typeof i.componentDidMount=="function"&&(t.flags|=4194308)):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=s),i.props=r,i.state=s,i.context=c,r=a):(typeof i.componentDidMount=="function"&&(t.flags|=4194308),r=!1)}else{i=t.stateNode,bu(e,t),a=t.memoizedProps,c=t.type===t.elementType?a:Fe(t.type,a),i.props=c,h=t.pendingProps,g=i.context,s=n.contextType,typeof s=="object"&&s!==null?s=Re(s):(s=me(n)?Mt:ie.current,s=cn(t,s));var y=n.getDerivedStateFromProps;(m=typeof y=="function"||typeof i.getSnapshotBeforeUpdate=="function")||typeof i.UNSAFE_componentWillReceiveProps!="function"&&typeof i.componentWillReceiveProps!="function"||(a!==h||g!==s)&&os(t,i,r,s),at=!1,g=t.memoizedState,i.state=g,fl(t,r,i,l);var x=t.memoizedState;a!==h||g!==x||he.current||at?(typeof y=="function"&&(Zo(t,n,y,r),x=t.memoizedState),(c=at||ls(t,n,c,r,g,x,s)||!1)?(m||typeof i.UNSAFE_componentWillUpdate!="function"&&typeof i.componentWillUpdate!="function"||(typeof i.componentWillUpdate=="function"&&i.componentWillUpdate(r,x,s),typeof i.UNSAFE_componentWillUpdate=="function"&&i.UNSAFE_componentWillUpdate(r,x,s)),typeof i.componentDidUpdate=="function"&&(t.flags|=4),typeof i.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof i.componentDidUpdate!="function"||a===e.memoizedProps&&g===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||a===e.memoizedProps&&g===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=x),i.props=r,i.state=x,i.context=s,r=c):(typeof i.componentDidUpdate!="function"||a===e.memoizedProps&&g===e.memoizedState||(t.flags|=4),typeof i.getSnapshotBeforeUpdate!="function"||a===e.memoizedProps&&g===e.memoizedState||(t.flags|=1024),r=!1)}return ni(e,t,n,r,o,l)}function ni(e,t,n,r,l,o){Sc(e,t);var i=(t.flags&128)!==0;if(!r&&!i)return l&&ba(t,n,!1),nt(e,t,o);r=t.stateNode,kp.current=t;var a=i&&typeof n.getDerivedStateFromError!="function"?null:r.render();return t.flags|=1,e!==null&&i?(t.child=fn(t,e.child,null,o),t.child=fn(t,null,a,o)):ae(e,t,a,o),t.memoizedState=r.state,l&&ba(t,n,!0),t.child}function Ec(e){var t=e.stateNode;t.pendingContext?Xa(e,t.pendingContext,t.pendingContext!==t.context):t.context&&Xa(e,t.context,!1),Vi(e,t.containerInfo)}function fs(e,t,n,r,l){return dn(),Ai(l),t.flags|=256,ae(e,t,n,r),t.child}var ri={dehydrated:null,treeContext:null,retryLane:0};function li(e){return{baseLanes:e,cachePool:null,transitions:null}}function Cc(e,t,n){var r=t.pendingProps,l=$.current,o=!1,i=(t.flags&128)!==0,a;if((a=i)||(a=e!==null&&e.memoizedState===null?!1:(l&2)!==0),a?(o=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(l|=1),I($,l&1),e===null)return bo(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?(t.mode&1?e.data==="$!"?t.lanes=8:t.lanes=1073741824:t.lanes=1,null):(i=r.children,e=r.fallback,o?(r=t.mode,o=t.child,i={mode:"hidden",children:i},!(r&1)&&o!==null?(o.childLanes=0,o.pendingProps=i):o=Ml(i,r,0,null),e=Ot(e,r,n,null),o.return=t,e.return=t,o.sibling=e,t.child=o,t.child.memoizedState=li(n),t.memoizedState=ri,e):Zi(t,i));if(l=e.memoizedState,l!==null&&(a=l.dehydrated,a!==null))return Sp(e,t,i,r,a,l,n);if(o){o=r.fallback,i=t.mode,l=e.child,a=l.sibling;var s={mode:"hidden",children:r.children};return!(i&1)&&t.child!==l?(r=t.child,r.childLanes=0,r.pendingProps=s,t.deletions=null):(r=wt(l,s),r.subtreeFlags=l.subtreeFlags&14680064),a!==null?o=wt(a,o):(o=Ot(o,i,n,null),o.flags|=2),o.return=t,r.return=t,r.sibling=o,t.child=r,r=o,o=t.child,i=e.child.memoizedState,i=i===null?li(n):{baseLanes:i.baseLanes|n,cachePool:null,transitions:i.transitions},o.memoizedState=i,o.childLanes=e.childLanes&~n,t.memoizedState=ri,r}return o=e.child,e=o.sibling,r=wt(o,{mode:"visible",children:r.children}),!(t.mode&1)&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function Zi(e,t){return t=Ml({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Tr(e,t,n,r){return r!==null&&Ai(r),fn(t,e.child,null,n),e=Zi(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Sp(e,t,n,r,l,o,i){if(n)return t.flags&256?(t.flags&=-257,r=ho(Error(S(422))),Tr(e,t,i,r)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(o=r.fallback,l=t.mode,r=Ml({mode:"visible",children:r.children},l,0,null),o=Ot(o,l,i,null),o.flags|=2,r.return=t,o.return=t,r.sibling=o,t.child=r,t.mode&1&&fn(t,e.child,null,i),t.child.memoizedState=li(i),t.memoizedState=ri,o);if(!(t.mode&1))return Tr(e,t,i,null);if(l.data==="$!"){if(r=l.nextSibling&&l.nextSibling.dataset,r)var a=r.dgst;return r=a,o=Error(S(419)),r=ho(o,r,void 0),Tr(e,t,i,r)}if(a=(i&e.childLanes)!==0,pe||a){if(r=q,r!==null){switch(i&-i){case 4:l=2;break;case 16:l=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:l=32;break;case 536870912:l=268435456;break;default:l=0}l=l&(r.suspendedLanes|i)?0:l,l!==0&&l!==o.retryLane&&(o.retryLane=l,tt(e,l),Ie(r,e,l,-1))}return la(),r=ho(Error(S(421))),Tr(e,t,i,r)}return l.data==="$?"?(t.flags|=128,t.child=e.child,t=Mp.bind(null,e),l._reactRetry=t,null):(e=o.treeContext,xe=gt(l.nextSibling),we=t,B=!0,Me=null,e!==null&&(Ce[je++]=Xe,Ce[je++]=be,Ce[je++]=Dt,Xe=e.id,be=e.overflow,Dt=t),t=Zi(t,r.children),t.flags|=4096,t)}function ps(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Jo(e.return,t,n)}function mo(e,t,n,r,l){var o=e.memoizedState;o===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:l}:(o.isBackwards=t,o.rendering=null,o.renderingStartTime=0,o.last=r,o.tail=n,o.tailMode=l)}function jc(e,t,n){var r=t.pendingProps,l=r.revealOrder,o=r.tail;if(ae(e,t,r.children,n),r=$.current,r&2)r=r&1|2,t.flags|=128;else{if(e!==null&&e.flags&128)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&ps(e,n,t);else if(e.tag===19)ps(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(I($,r),!(t.mode&1))t.memoizedState=null;else switch(l){case"forwards":for(n=t.child,l=null;n!==null;)e=n.alternate,e!==null&&pl(e)===null&&(l=n),n=n.sibling;n=l,n===null?(l=t.child,t.child=null):(l=n.sibling,n.sibling=null),mo(t,!1,l,n,o);break;case"backwards":for(n=null,l=t.child,t.child=null;l!==null;){if(e=l.alternate,e!==null&&pl(e)===null){t.child=l;break}e=l.sibling,l.sibling=n,n=l,l=e}mo(t,!0,n,null,o);break;case"together":mo(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Qr(e,t){!(t.mode&1)&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function nt(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),At|=t.lanes,!(n&t.childLanes))return null;if(e!==null&&t.child!==e.child)throw Error(S(153));if(t.child!==null){for(e=t.child,n=wt(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=wt(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Ep(e,t,n){switch(t.tag){case 3:Ec(t),dn();break;case 5:Ju(t);break;case 1:me(t.type)&&al(t);break;case 4:Vi(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,l=t.memoizedProps.value;I(cl,r._currentValue),r._currentValue=l;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated!==null?(I($,$.current&1),t.flags|=128,null):n&t.child.childLanes?Cc(e,t,n):(I($,$.current&1),e=nt(e,t,n),e!==null?e.sibling:null);I($,$.current&1);break;case 19:if(r=(n&t.childLanes)!==0,e.flags&128){if(r)return jc(e,t,n);t.flags|=128}if(l=t.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),I($,$.current),r)break;return null;case 22:case 23:return t.lanes=0,kc(e,t,n)}return nt(e,t,n)}var Nc,oi,Pc,Rc;Nc=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};oi=function(){};Pc=function(e,t,n,r){var l=e.memoizedProps;if(l!==r){e=t.stateNode,Tt(Ve.current);var o=null;switch(n){case"input":l=Po(e,l),r=Po(e,r),o=[];break;case"select":l=V({},l,{value:void 0}),r=V({},r,{value:void 0}),o=[];break;case"textarea":l=_o(e,l),r=_o(e,r),o=[];break;default:typeof l.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=ol)}To(n,r);var i;n=null;for(c in l)if(!r.hasOwnProperty(c)&&l.hasOwnProperty(c)&&l[c]!=null)if(c==="style"){var a=l[c];for(i in a)a.hasOwnProperty(i)&&(n||(n={}),n[i]="")}else c!=="dangerouslySetInnerHTML"&&c!=="children"&&c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&c!=="autoFocus"&&(Qn.hasOwnProperty(c)?o||(o=[]):(o=o||[]).push(c,null));for(c in r){var s=r[c];if(a=l!=null?l[c]:void 0,r.hasOwnProperty(c)&&s!==a&&(s!=null||a!=null))if(c==="style")if(a){for(i in a)!a.hasOwnProperty(i)||s&&s.hasOwnProperty(i)||(n||(n={}),n[i]="");for(i in s)s.hasOwnProperty(i)&&a[i]!==s[i]&&(n||(n={}),n[i]=s[i])}else n||(o||(o=[]),o.push(c,n)),n=s;else c==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,a=a?a.__html:void 0,s!=null&&a!==s&&(o=o||[]).push(c,s)):c==="children"?typeof s!="string"&&typeof s!="number"||(o=o||[]).push(c,""+s):c!=="suppressContentEditableWarning"&&c!=="suppressHydrationWarning"&&(Qn.hasOwnProperty(c)?(s!=null&&c==="onScroll"&&A("scroll",e),o||a===s||(o=[])):(o=o||[]).push(c,s))}n&&(o=o||[]).push("style",n);var c=o;(t.updateQueue=c)&&(t.flags|=4)}};Rc=function(e,t,n,r){n!==r&&(t.flags|=4)};function zn(e,t){if(!B)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function le(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags&14680064,r|=l.flags&14680064,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)n|=l.lanes|l.childLanes,r|=l.subtreeFlags,r|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function Cp(e,t,n){var r=t.pendingProps;switch(Ii(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return le(t),null;case 1:return me(t.type)&&il(),le(t),null;case 3:return r=t.stateNode,pn(),U(he),U(ie),Yi(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(_r(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&!(t.flags&256)||(t.flags|=1024,Me!==null&&(pi(Me),Me=null))),oi(e,t),le(t),null;case 5:Qi(t);var l=Tt(rr.current);if(n=t.type,e!==null&&t.stateNode!=null)Pc(e,t,n,r,l),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!r){if(t.stateNode===null)throw Error(S(166));return le(t),null}if(e=Tt(Ve.current),_r(t)){r=t.stateNode,n=t.type;var o=t.memoizedProps;switch(r[He]=t,r[tr]=o,e=(t.mode&1)!==0,n){case"dialog":A("cancel",r),A("close",r);break;case"iframe":case"object":case"embed":A("load",r);break;case"video":case"audio":for(l=0;l<Mn.length;l++)A(Mn[l],r);break;case"source":A("error",r);break;case"img":case"image":case"link":A("error",r),A("load",r);break;case"details":A("toggle",r);break;case"input":Sa(r,o),A("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!o.multiple},A("invalid",r);break;case"textarea":Ca(r,o),A("invalid",r)}To(n,o),l=null;for(var i in o)if(o.hasOwnProperty(i)){var a=o[i];i==="children"?typeof a=="string"?r.textContent!==a&&(o.suppressHydrationWarning!==!0&&zr(r.textContent,a,e),l=["children",a]):typeof a=="number"&&r.textContent!==""+a&&(o.suppressHydrationWarning!==!0&&zr(r.textContent,a,e),l=["children",""+a]):Qn.hasOwnProperty(i)&&a!=null&&i==="onScroll"&&A("scroll",r)}switch(n){case"input":kr(r),Ea(r,o,!0);break;case"textarea":kr(r),ja(r);break;case"select":case"option":break;default:typeof o.onClick=="function"&&(r.onclick=ol)}r=l,t.updateQueue=r,r!==null&&(t.flags|=4)}else{i=l.nodeType===9?l:l.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=nu(n)),e==="http://www.w3.org/1999/xhtml"?n==="script"?(e=i.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=i.createElement(n,{is:r.is}):(e=i.createElement(n),n==="select"&&(i=e,r.multiple?i.multiple=!0:r.size&&(i.size=r.size))):e=i.createElementNS(e,n),e[He]=t,e[tr]=r,Nc(e,t,!1,!1),t.stateNode=e;e:{switch(i=Fo(n,r),n){case"dialog":A("cancel",e),A("close",e),l=r;break;case"iframe":case"object":case"embed":A("load",e),l=r;break;case"video":case"audio":for(l=0;l<Mn.length;l++)A(Mn[l],e);l=r;break;case"source":A("error",e),l=r;break;case"img":case"image":case"link":A("error",e),A("load",e),l=r;break;case"details":A("toggle",e),l=r;break;case"input":Sa(e,r),l=Po(e,r),A("invalid",e);break;case"option":l=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},l=V({},r,{value:void 0}),A("invalid",e);break;case"textarea":Ca(e,r),l=_o(e,r),A("invalid",e);break;default:l=r}To(n,l),a=l;for(o in a)if(a.hasOwnProperty(o)){var s=a[o];o==="style"?ou(e,s):o==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,s!=null&&ru(e,s)):o==="children"?typeof s=="string"?(n!=="textarea"||s!=="")&&Yn(e,s):typeof s=="number"&&Yn(e,""+s):o!=="suppressContentEditableWarning"&&o!=="suppressHydrationWarning"&&o!=="autoFocus"&&(Qn.hasOwnProperty(o)?s!=null&&o==="onScroll"&&A("scroll",e):s!=null&&Si(e,o,s,i))}switch(n){case"input":kr(e),Ea(e,r,!1);break;case"textarea":kr(e),ja(e);break;case"option":r.value!=null&&e.setAttribute("value",""+kt(r.value));break;case"select":e.multiple=!!r.multiple,o=r.value,o!=null?nn(e,!!r.multiple,o,!1):r.defaultValue!=null&&nn(e,!!r.multiple,r.defaultValue,!0);break;default:typeof l.onClick=="function"&&(e.onclick=ol)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return le(t),null;case 6:if(e&&t.stateNode!=null)Rc(e,t,e.memoizedProps,r);else{if(typeof r!="string"&&t.stateNode===null)throw Error(S(166));if(n=Tt(rr.current),Tt(Ve.current),_r(t)){if(r=t.stateNode,n=t.memoizedProps,r[He]=t,(o=r.nodeValue!==n)&&(e=we,e!==null))switch(e.tag){case 3:zr(r.nodeValue,n,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&zr(r.nodeValue,n,(e.mode&1)!==0)}o&&(t.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[He]=t,t.stateNode=r}return le(t),null;case 13:if(U($),r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(B&&xe!==null&&t.mode&1&&!(t.flags&128))Yu(),dn(),t.flags|=98560,o=!1;else if(o=_r(t),r!==null&&r.dehydrated!==null){if(e===null){if(!o)throw Error(S(318));if(o=t.memoizedState,o=o!==null?o.dehydrated:null,!o)throw Error(S(317));o[He]=t}else dn(),!(t.flags&128)&&(t.memoizedState=null),t.flags|=4;le(t),o=!1}else Me!==null&&(pi(Me),Me=null),o=!0;if(!o)return t.flags&65536?t:null}return t.flags&128?(t.lanes=n,t):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(t.child.flags|=8192,t.mode&1&&(e===null||$.current&1?b===0&&(b=3):la())),t.updateQueue!==null&&(t.flags|=4),le(t),null);case 4:return pn(),oi(e,t),e===null&&qn(t.stateNode.containerInfo),le(t),null;case 10:return $i(t.type._context),le(t),null;case 17:return me(t.type)&&il(),le(t),null;case 19:if(U($),o=t.memoizedState,o===null)return le(t),null;if(r=(t.flags&128)!==0,i=o.rendering,i===null)if(r)zn(o,!1);else{if(b!==0||e!==null&&e.flags&128)for(e=t.child;e!==null;){if(i=pl(e),i!==null){for(t.flags|=128,zn(o,!1),r=i.updateQueue,r!==null&&(t.updateQueue=r,t.flags|=4),t.subtreeFlags=0,r=n,n=t.child;n!==null;)o=n,e=r,o.flags&=14680066,i=o.alternate,i===null?(o.childLanes=0,o.lanes=e,o.child=null,o.subtreeFlags=0,o.memoizedProps=null,o.memoizedState=null,o.updateQueue=null,o.dependencies=null,o.stateNode=null):(o.childLanes=i.childLanes,o.lanes=i.lanes,o.child=i.child,o.subtreeFlags=0,o.deletions=null,o.memoizedProps=i.memoizedProps,o.memoizedState=i.memoizedState,o.updateQueue=i.updateQueue,o.type=i.type,e=i.dependencies,o.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return I($,$.current&1|2),t.child}e=e.sibling}o.tail!==null&&K()>mn&&(t.flags|=128,r=!0,zn(o,!1),t.lanes=4194304)}else{if(!r)if(e=pl(i),e!==null){if(t.flags|=128,r=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),zn(o,!0),o.tail===null&&o.tailMode==="hidden"&&!i.alternate&&!B)return le(t),null}else 2*K()-o.renderingStartTime>mn&&n!==1073741824&&(t.flags|=128,r=!0,zn(o,!1),t.lanes=4194304);o.isBackwards?(i.sibling=t.child,t.child=i):(n=o.last,n!==null?n.sibling=i:t.child=i,o.last=i)}return o.tail!==null?(t=o.tail,o.rendering=t,o.tail=t.sibling,o.renderingStartTime=K(),t.sibling=null,n=$.current,I($,r?n&1|2:n&1),t):(le(t),null);case 22:case 23:return ra(),r=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(t.flags|=8192),r&&t.mode&1?ye&1073741824&&(le(t),t.subtreeFlags&6&&(t.flags|=8192)):le(t),null;case 24:return null;case 25:return null}throw Error(S(156,t.tag))}function jp(e,t){switch(Ii(t),t.tag){case 1:return me(t.type)&&il(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return pn(),U(he),U(ie),Yi(),e=t.flags,e&65536&&!(e&128)?(t.flags=e&-65537|128,t):null;case 5:return Qi(t),null;case 13:if(U($),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(S(340));dn()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return U($),null;case 4:return pn(),null;case 10:return $i(t.type._context),null;case 22:case 23:return ra(),null;case 24:return null;default:return null}}var Fr=!1,oe=!1,Np=typeof WeakSet=="function"?WeakSet:Set,N=null;function en(e,t){var n=e.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){Q(e,t,r)}else n.current=null}function ii(e,t,n){try{n()}catch(r){Q(e,t,r)}}var hs=!1;function Pp(e,t){if(Wo=nl,e=Fu(),Mi(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var l=r.anchorOffset,o=r.focusNode;r=r.focusOffset;try{n.nodeType,o.nodeType}catch{n=null;break e}var i=0,a=-1,s=-1,c=0,m=0,h=e,g=null;t:for(;;){for(var y;h!==n||l!==0&&h.nodeType!==3||(a=i+l),h!==o||r!==0&&h.nodeType!==3||(s=i+r),h.nodeType===3&&(i+=h.nodeValue.length),(y=h.firstChild)!==null;)g=h,h=y;for(;;){if(h===e)break t;if(g===n&&++c===l&&(a=i),g===o&&++m===r&&(s=i),(y=h.nextSibling)!==null)break;h=g,g=h.parentNode}h=y}n=a===-1||s===-1?null:{start:a,end:s}}else n=null}n=n||{start:0,end:0}}else n=null;for(Vo={focusedElem:e,selectionRange:n},nl=!1,N=t;N!==null;)if(t=N,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,N=e;else for(;N!==null;){t=N;try{var x=t.alternate;if(t.flags&1024)switch(t.tag){case 0:case 11:case 15:break;case 1:if(x!==null){var k=x.memoizedProps,C=x.memoizedState,f=t.stateNode,d=f.getSnapshotBeforeUpdate(t.elementType===t.type?k:Fe(t.type,k),C);f.__reactInternalSnapshotBeforeUpdate=d}break;case 3:var p=t.stateNode.containerInfo;p.nodeType===1?p.textContent="":p.nodeType===9&&p.documentElement&&p.removeChild(p.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(S(163))}}catch(w){Q(t,t.return,w)}if(e=t.sibling,e!==null){e.return=t.return,N=e;break}N=t.return}return x=hs,hs=!1,x}function Hn(e,t,n){var r=t.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var l=r=r.next;do{if((l.tag&e)===e){var o=l.destroy;l.destroy=void 0,o!==void 0&&ii(t,n,o)}l=l.next}while(l!==r)}}function Fl(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function ai(e){var t=e.ref;if(t!==null){var n=e.stateNode;switch(e.tag){case 5:e=n;break;default:e=n}typeof t=="function"?t(e):t.current=e}}function zc(e){var t=e.alternate;t!==null&&(e.alternate=null,zc(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[He],delete t[tr],delete t[Ko],delete t[up],delete t[cp])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function _c(e){return e.tag===5||e.tag===3||e.tag===4}function ms(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||_c(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function si(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=ol));else if(r!==4&&(e=e.child,e!==null))for(si(e,t,n),e=e.sibling;e!==null;)si(e,t,n),e=e.sibling}function ui(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(ui(e,t,n),e=e.sibling;e!==null;)ui(e,t,n),e=e.sibling}var ee=null,Oe=!1;function ot(e,t,n){for(n=n.child;n!==null;)Lc(e,t,n),n=n.sibling}function Lc(e,t,n){if(We&&typeof We.onCommitFiberUnmount=="function")try{We.onCommitFiberUnmount(jl,n)}catch{}switch(n.tag){case 5:oe||en(n,t);case 6:var r=ee,l=Oe;ee=null,ot(e,t,n),ee=r,Oe=l,ee!==null&&(Oe?(e=ee,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):ee.removeChild(n.stateNode));break;case 18:ee!==null&&(Oe?(e=ee,n=n.stateNode,e.nodeType===8?ao(e.parentNode,n):e.nodeType===1&&ao(e,n),bn(e)):ao(ee,n.stateNode));break;case 4:r=ee,l=Oe,ee=n.stateNode.containerInfo,Oe=!0,ot(e,t,n),ee=r,Oe=l;break;case 0:case 11:case 14:case 15:if(!oe&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){l=r=r.next;do{var o=l,i=o.destroy;o=o.tag,i!==void 0&&(o&2||o&4)&&ii(n,t,i),l=l.next}while(l!==r)}ot(e,t,n);break;case 1:if(!oe&&(en(n,t),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(a){Q(n,t,a)}ot(e,t,n);break;case 21:ot(e,t,n);break;case 22:n.mode&1?(oe=(r=oe)||n.memoizedState!==null,ot(e,t,n),oe=r):ot(e,t,n);break;default:ot(e,t,n)}}function gs(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new Np),t.forEach(function(r){var l=Dp.bind(null,e,r);n.has(r)||(n.add(r),r.then(l,l))})}}function Te(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var l=n[r];try{var o=e,i=t,a=i;e:for(;a!==null;){switch(a.tag){case 5:ee=a.stateNode,Oe=!1;break e;case 3:ee=a.stateNode.containerInfo,Oe=!0;break e;case 4:ee=a.stateNode.containerInfo,Oe=!0;break e}a=a.return}if(ee===null)throw Error(S(160));Lc(o,i,l),ee=null,Oe=!1;var s=l.alternate;s!==null&&(s.return=null),l.return=null}catch(c){Q(l,t,c)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)Tc(t,e),t=t.sibling}function Tc(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Te(t,e),Be(e),r&4){try{Hn(3,e,e.return),Fl(3,e)}catch(k){Q(e,e.return,k)}try{Hn(5,e,e.return)}catch(k){Q(e,e.return,k)}}break;case 1:Te(t,e),Be(e),r&512&&n!==null&&en(n,n.return);break;case 5:if(Te(t,e),Be(e),r&512&&n!==null&&en(n,n.return),e.flags&32){var l=e.stateNode;try{Yn(l,"")}catch(k){Q(e,e.return,k)}}if(r&4&&(l=e.stateNode,l!=null)){var o=e.memoizedProps,i=n!==null?n.memoizedProps:o,a=e.type,s=e.updateQueue;if(e.updateQueue=null,s!==null)try{a==="input"&&o.type==="radio"&&o.name!=null&&eu(l,o),Fo(a,i);var c=Fo(a,o);for(i=0;i<s.length;i+=2){var m=s[i],h=s[i+1];m==="style"?ou(l,h):m==="dangerouslySetInnerHTML"?ru(l,h):m==="children"?Yn(l,h):Si(l,m,h,c)}switch(a){case"input":Ro(l,o);break;case"textarea":tu(l,o);break;case"select":var g=l._wrapperState.wasMultiple;l._wrapperState.wasMultiple=!!o.multiple;var y=o.value;y!=null?nn(l,!!o.multiple,y,!1):g!==!!o.multiple&&(o.defaultValue!=null?nn(l,!!o.multiple,o.defaultValue,!0):nn(l,!!o.multiple,o.multiple?[]:"",!1))}l[tr]=o}catch(k){Q(e,e.return,k)}}break;case 6:if(Te(t,e),Be(e),r&4){if(e.stateNode===null)throw Error(S(162));l=e.stateNode,o=e.memoizedProps;try{l.nodeValue=o}catch(k){Q(e,e.return,k)}}break;case 3:if(Te(t,e),Be(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{bn(t.containerInfo)}catch(k){Q(e,e.return,k)}break;case 4:Te(t,e),Be(e);break;case 13:Te(t,e),Be(e),l=e.child,l.flags&8192&&(o=l.memoizedState!==null,l.stateNode.isHidden=o,!o||l.alternate!==null&&l.alternate.memoizedState!==null||(ta=K())),r&4&&gs(e);break;case 22:if(m=n!==null&&n.memoizedState!==null,e.mode&1?(oe=(c=oe)||m,Te(t,e),oe=c):Te(t,e),Be(e),r&8192){if(c=e.memoizedState!==null,(e.stateNode.isHidden=c)&&!m&&e.mode&1)for(N=e,m=e.child;m!==null;){for(h=N=m;N!==null;){switch(g=N,y=g.child,g.tag){case 0:case 11:case 14:case 15:Hn(4,g,g.return);break;case 1:en(g,g.return);var x=g.stateNode;if(typeof x.componentWillUnmount=="function"){r=g,n=g.return;try{t=r,x.props=t.memoizedProps,x.state=t.memoizedState,x.componentWillUnmount()}catch(k){Q(r,n,k)}}break;case 5:en(g,g.return);break;case 22:if(g.memoizedState!==null){ys(h);continue}}y!==null?(y.return=g,N=y):ys(h)}m=m.sibling}e:for(m=null,h=e;;){if(h.tag===5){if(m===null){m=h;try{l=h.stateNode,c?(o=l.style,typeof o.setProperty=="function"?o.setProperty("display","none","important"):o.display="none"):(a=h.stateNode,s=h.memoizedProps.style,i=s!=null&&s.hasOwnProperty("display")?s.display:null,a.style.display=lu("display",i))}catch(k){Q(e,e.return,k)}}}else if(h.tag===6){if(m===null)try{h.stateNode.nodeValue=c?"":h.memoizedProps}catch(k){Q(e,e.return,k)}}else if((h.tag!==22&&h.tag!==23||h.memoizedState===null||h===e)&&h.child!==null){h.child.return=h,h=h.child;continue}if(h===e)break e;for(;h.sibling===null;){if(h.return===null||h.return===e)break e;m===h&&(m=null),h=h.return}m===h&&(m=null),h.sibling.return=h.return,h=h.sibling}}break;case 19:Te(t,e),Be(e),r&4&&gs(e);break;case 21:break;default:Te(t,e),Be(e)}}function Be(e){var t=e.flags;if(t&2){try{e:{for(var n=e.return;n!==null;){if(_c(n)){var r=n;break e}n=n.return}throw Error(S(160))}switch(r.tag){case 5:var l=r.stateNode;r.flags&32&&(Yn(l,""),r.flags&=-33);var o=ms(e);ui(e,o,l);break;case 3:case 4:var i=r.stateNode.containerInfo,a=ms(e);si(e,a,i);break;default:throw Error(S(161))}}catch(s){Q(e,e.return,s)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Rp(e,t,n){N=e,Fc(e)}function Fc(e,t,n){for(var r=(e.mode&1)!==0;N!==null;){var l=N,o=l.child;if(l.tag===22&&r){var i=l.memoizedState!==null||Fr;if(!i){var a=l.alternate,s=a!==null&&a.memoizedState!==null||oe;a=Fr;var c=oe;if(Fr=i,(oe=s)&&!c)for(N=l;N!==null;)i=N,s=i.child,i.tag===22&&i.memoizedState!==null?xs(l):s!==null?(s.return=i,N=s):xs(l);for(;o!==null;)N=o,Fc(o),o=o.sibling;N=l,Fr=a,oe=c}vs(e)}else l.subtreeFlags&8772&&o!==null?(o.return=l,N=o):vs(e)}}function vs(e){for(;N!==null;){var t=N;if(t.flags&8772){var n=t.alternate;try{if(t.flags&8772)switch(t.tag){case 0:case 11:case 15:oe||Fl(5,t);break;case 1:var r=t.stateNode;if(t.flags&4&&!oe)if(n===null)r.componentDidMount();else{var l=t.elementType===t.type?n.memoizedProps:Fe(t.type,n.memoizedProps);r.componentDidUpdate(l,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var o=t.updateQueue;o!==null&&ts(t,o,r);break;case 3:var i=t.updateQueue;if(i!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}ts(t,i,n)}break;case 5:var a=t.stateNode;if(n===null&&t.flags&4){n=a;var s=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":s.autoFocus&&n.focus();break;case"img":s.src&&(n.src=s.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var c=t.alternate;if(c!==null){var m=c.memoizedState;if(m!==null){var h=m.dehydrated;h!==null&&bn(h)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(S(163))}oe||t.flags&512&&ai(t)}catch(g){Q(t,t.return,g)}}if(t===e){N=null;break}if(n=t.sibling,n!==null){n.return=t.return,N=n;break}N=t.return}}function ys(e){for(;N!==null;){var t=N;if(t===e){N=null;break}var n=t.sibling;if(n!==null){n.return=t.return,N=n;break}N=t.return}}function xs(e){for(;N!==null;){var t=N;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{Fl(4,t)}catch(s){Q(t,n,s)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount=="function"){var l=t.return;try{r.componentDidMount()}catch(s){Q(t,l,s)}}var o=t.return;try{ai(t)}catch(s){Q(t,o,s)}break;case 5:var i=t.return;try{ai(t)}catch(s){Q(t,i,s)}}}catch(s){Q(t,t.return,s)}if(t===e){N=null;break}var a=t.sibling;if(a!==null){a.return=t.return,N=a;break}N=t.return}}var zp=Math.ceil,gl=lt.ReactCurrentDispatcher,qi=lt.ReactCurrentOwner,Pe=lt.ReactCurrentBatchConfig,O=0,q=null,G=null,te=0,ye=0,tn=Ct(0),b=0,ar=null,At=0,Ol=0,ea=0,Wn=null,fe=null,ta=0,mn=1/0,Ke=null,vl=!1,ci=null,yt=null,Or=!1,dt=null,yl=0,Vn=0,di=null,Yr=-1,Kr=0;function se(){return O&6?K():Yr!==-1?Yr:Yr=K()}function xt(e){return e.mode&1?O&2&&te!==0?te&-te:fp.transition!==null?(Kr===0&&(Kr=vu()),Kr):(e=M,e!==0||(e=window.event,e=e===void 0?16:Cu(e.type)),e):1}function Ie(e,t,n,r){if(50<Vn)throw Vn=0,di=null,Error(S(185));cr(e,n,r),(!(O&2)||e!==q)&&(e===q&&(!(O&2)&&(Ol|=n),b===4&&ut(e,te)),ge(e,r),n===1&&O===0&&!(t.mode&1)&&(mn=K()+500,_l&&jt()))}function ge(e,t){var n=e.callbackNode;ff(e,t);var r=tl(e,e===q?te:0);if(r===0)n!==null&&Ra(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&Ra(n),t===1)e.tag===0?dp(ws.bind(null,e)):Wu(ws.bind(null,e)),ap(function(){!(O&6)&&jt()}),n=null;else{switch(yu(r)){case 1:n=Pi;break;case 4:n=mu;break;case 16:n=el;break;case 536870912:n=gu;break;default:n=el}n=$c(n,Oc.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function Oc(e,t){if(Yr=-1,Kr=0,O&6)throw Error(S(327));var n=e.callbackNode;if(sn()&&e.callbackNode!==n)return null;var r=tl(e,e===q?te:0);if(r===0)return null;if(r&30||r&e.expiredLanes||t)t=xl(e,r);else{t=r;var l=O;O|=2;var o=Dc();(q!==e||te!==t)&&(Ke=null,mn=K()+500,Ft(e,t));do try{Tp();break}catch(a){Mc(e,a)}while(!0);Bi(),gl.current=o,O=l,G!==null?t=0:(q=null,te=0,t=b)}if(t!==0){if(t===2&&(l=Ao(e),l!==0&&(r=l,t=fi(e,l))),t===1)throw n=ar,Ft(e,0),ut(e,r),ge(e,K()),n;if(t===6)ut(e,r);else{if(l=e.current.alternate,!(r&30)&&!_p(l)&&(t=xl(e,r),t===2&&(o=Ao(e),o!==0&&(r=o,t=fi(e,o))),t===1))throw n=ar,Ft(e,0),ut(e,r),ge(e,K()),n;switch(e.finishedWork=l,e.finishedLanes=r,t){case 0:case 1:throw Error(S(345));case 2:zt(e,fe,Ke);break;case 3:if(ut(e,r),(r&130023424)===r&&(t=ta+500-K(),10<t)){if(tl(e,0)!==0)break;if(l=e.suspendedLanes,(l&r)!==r){se(),e.pingedLanes|=e.suspendedLanes&l;break}e.timeoutHandle=Yo(zt.bind(null,e,fe,Ke),t);break}zt(e,fe,Ke);break;case 4:if(ut(e,r),(r&4194240)===r)break;for(t=e.eventTimes,l=-1;0<r;){var i=31-De(r);o=1<<i,i=t[i],i>l&&(l=i),r&=~o}if(r=l,r=K()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*zp(r/1960))-r,10<r){e.timeoutHandle=Yo(zt.bind(null,e,fe,Ke),r);break}zt(e,fe,Ke);break;case 5:zt(e,fe,Ke);break;default:throw Error(S(329))}}}return ge(e,K()),e.callbackNode===n?Oc.bind(null,e):null}function fi(e,t){var n=Wn;return e.current.memoizedState.isDehydrated&&(Ft(e,t).flags|=256),e=xl(e,t),e!==2&&(t=fe,fe=n,t!==null&&pi(t)),e}function pi(e){fe===null?fe=e:fe.push.apply(fe,e)}function _p(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var l=n[r],o=l.getSnapshot;l=l.value;try{if(!Ae(o(),l))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ut(e,t){for(t&=~ea,t&=~Ol,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-De(t),r=1<<n;e[n]=-1,t&=~r}}function ws(e){if(O&6)throw Error(S(327));sn();var t=tl(e,0);if(!(t&1))return ge(e,K()),null;var n=xl(e,t);if(e.tag!==0&&n===2){var r=Ao(e);r!==0&&(t=r,n=fi(e,r))}if(n===1)throw n=ar,Ft(e,0),ut(e,t),ge(e,K()),n;if(n===6)throw Error(S(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,zt(e,fe,Ke),ge(e,K()),null}function na(e,t){var n=O;O|=1;try{return e(t)}finally{O=n,O===0&&(mn=K()+500,_l&&jt())}}function Ut(e){dt!==null&&dt.tag===0&&!(O&6)&&sn();var t=O;O|=1;var n=Pe.transition,r=M;try{if(Pe.transition=null,M=1,e)return e()}finally{M=r,Pe.transition=n,O=t,!(O&6)&&jt()}}function ra(){ye=tn.current,U(tn)}function Ft(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,ip(n)),G!==null)for(n=G.return;n!==null;){var r=n;switch(Ii(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&il();break;case 3:pn(),U(he),U(ie),Yi();break;case 5:Qi(r);break;case 4:pn();break;case 13:U($);break;case 19:U($);break;case 10:$i(r.type._context);break;case 22:case 23:ra()}n=n.return}if(q=e,G=e=wt(e.current,null),te=ye=t,b=0,ar=null,ea=Ol=At=0,fe=Wn=null,Lt!==null){for(t=0;t<Lt.length;t++)if(n=Lt[t],r=n.interleaved,r!==null){n.interleaved=null;var l=r.next,o=n.pending;if(o!==null){var i=o.next;o.next=l,r.next=i}n.pending=r}Lt=null}return e}function Mc(e,t){do{var n=G;try{if(Bi(),Wr.current=ml,hl){for(var r=H.memoizedState;r!==null;){var l=r.queue;l!==null&&(l.pending=null),r=r.next}hl=!1}if(It=0,Z=X=H=null,$n=!1,lr=0,qi.current=null,n===null||n.return===null){b=1,ar=t,G=null;break}e:{var o=e,i=n.return,a=n,s=t;if(t=te,a.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){var c=s,m=a,h=m.tag;if(!(m.mode&1)&&(h===0||h===11||h===15)){var g=m.alternate;g?(m.updateQueue=g.updateQueue,m.memoizedState=g.memoizedState,m.lanes=g.lanes):(m.updateQueue=null,m.memoizedState=null)}var y=as(i);if(y!==null){y.flags&=-257,ss(y,i,a,o,t),y.mode&1&&is(o,c,t),t=y,s=c;var x=t.updateQueue;if(x===null){var k=new Set;k.add(s),t.updateQueue=k}else x.add(s);break e}else{if(!(t&1)){is(o,c,t),la();break e}s=Error(S(426))}}else if(B&&a.mode&1){var C=as(i);if(C!==null){!(C.flags&65536)&&(C.flags|=256),ss(C,i,a,o,t),Ai(hn(s,a));break e}}o=s=hn(s,a),b!==4&&(b=2),Wn===null?Wn=[o]:Wn.push(o),o=i;do{switch(o.tag){case 3:o.flags|=65536,t&=-t,o.lanes|=t;var f=yc(o,s,t);es(o,f);break e;case 1:a=s;var d=o.type,p=o.stateNode;if(!(o.flags&128)&&(typeof d.getDerivedStateFromError=="function"||p!==null&&typeof p.componentDidCatch=="function"&&(yt===null||!yt.has(p)))){o.flags|=65536,t&=-t,o.lanes|=t;var w=xc(o,a,t);es(o,w);break e}}o=o.return}while(o!==null)}Ac(n)}catch(E){t=E,G===n&&n!==null&&(G=n=n.return);continue}break}while(!0)}function Dc(){var e=gl.current;return gl.current=ml,e===null?ml:e}function la(){(b===0||b===3||b===2)&&(b=4),q===null||!(At&268435455)&&!(Ol&268435455)||ut(q,te)}function xl(e,t){var n=O;O|=2;var r=Dc();(q!==e||te!==t)&&(Ke=null,Ft(e,t));do try{Lp();break}catch(l){Mc(e,l)}while(!0);if(Bi(),O=n,gl.current=r,G!==null)throw Error(S(261));return q=null,te=0,b}function Lp(){for(;G!==null;)Ic(G)}function Tp(){for(;G!==null&&!nf();)Ic(G)}function Ic(e){var t=Bc(e.alternate,e,ye);e.memoizedProps=e.pendingProps,t===null?Ac(e):G=t,qi.current=null}function Ac(e){var t=e;do{var n=t.alternate;if(e=t.return,t.flags&32768){if(n=jp(n,t),n!==null){n.flags&=32767,G=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{b=6,G=null;return}}else if(n=Cp(n,t,ye),n!==null){G=n;return}if(t=t.sibling,t!==null){G=t;return}G=t=e}while(t!==null);b===0&&(b=5)}function zt(e,t,n){var r=M,l=Pe.transition;try{Pe.transition=null,M=1,Fp(e,t,n,r)}finally{Pe.transition=l,M=r}return null}function Fp(e,t,n,r){do sn();while(dt!==null);if(O&6)throw Error(S(327));n=e.finishedWork;var l=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(S(177));e.callbackNode=null,e.callbackPriority=0;var o=n.lanes|n.childLanes;if(pf(e,o),e===q&&(G=q=null,te=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||Or||(Or=!0,$c(el,function(){return sn(),null})),o=(n.flags&15990)!==0,n.subtreeFlags&15990||o){o=Pe.transition,Pe.transition=null;var i=M;M=1;var a=O;O|=4,qi.current=null,Pp(e,n),Tc(n,e),qf(Vo),nl=!!Wo,Vo=Wo=null,e.current=n,Rp(n),rf(),O=a,M=i,Pe.transition=o}else e.current=n;if(Or&&(Or=!1,dt=e,yl=l),o=e.pendingLanes,o===0&&(yt=null),af(n.stateNode),ge(e,K()),t!==null)for(r=e.onRecoverableError,n=0;n<t.length;n++)l=t[n],r(l.value,{componentStack:l.stack,digest:l.digest});if(vl)throw vl=!1,e=ci,ci=null,e;return yl&1&&e.tag!==0&&sn(),o=e.pendingLanes,o&1?e===di?Vn++:(Vn=0,di=e):Vn=0,jt(),null}function sn(){if(dt!==null){var e=yu(yl),t=Pe.transition,n=M;try{if(Pe.transition=null,M=16>e?16:e,dt===null)var r=!1;else{if(e=dt,dt=null,yl=0,O&6)throw Error(S(331));var l=O;for(O|=4,N=e.current;N!==null;){var o=N,i=o.child;if(N.flags&16){var a=o.deletions;if(a!==null){for(var s=0;s<a.length;s++){var c=a[s];for(N=c;N!==null;){var m=N;switch(m.tag){case 0:case 11:case 15:Hn(8,m,o)}var h=m.child;if(h!==null)h.return=m,N=h;else for(;N!==null;){m=N;var g=m.sibling,y=m.return;if(zc(m),m===c){N=null;break}if(g!==null){g.return=y,N=g;break}N=y}}}var x=o.alternate;if(x!==null){var k=x.child;if(k!==null){x.child=null;do{var C=k.sibling;k.sibling=null,k=C}while(k!==null)}}N=o}}if(o.subtreeFlags&2064&&i!==null)i.return=o,N=i;else e:for(;N!==null;){if(o=N,o.flags&2048)switch(o.tag){case 0:case 11:case 15:Hn(9,o,o.return)}var f=o.sibling;if(f!==null){f.return=o.return,N=f;break e}N=o.return}}var d=e.current;for(N=d;N!==null;){i=N;var p=i.child;if(i.subtreeFlags&2064&&p!==null)p.return=i,N=p;else e:for(i=d;N!==null;){if(a=N,a.flags&2048)try{switch(a.tag){case 0:case 11:case 15:Fl(9,a)}}catch(E){Q(a,a.return,E)}if(a===i){N=null;break e}var w=a.sibling;if(w!==null){w.return=a.return,N=w;break e}N=a.return}}if(O=l,jt(),We&&typeof We.onPostCommitFiberRoot=="function")try{We.onPostCommitFiberRoot(jl,e)}catch{}r=!0}return r}finally{M=n,Pe.transition=t}}return!1}function ks(e,t,n){t=hn(n,t),t=yc(e,t,1),e=vt(e,t,1),t=se(),e!==null&&(cr(e,1,t),ge(e,t))}function Q(e,t,n){if(e.tag===3)ks(e,e,n);else for(;t!==null;){if(t.tag===3){ks(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(yt===null||!yt.has(r))){e=hn(n,e),e=xc(t,e,1),t=vt(t,e,1),e=se(),t!==null&&(cr(t,1,e),ge(t,e));break}}t=t.return}}function Op(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=se(),e.pingedLanes|=e.suspendedLanes&n,q===e&&(te&n)===n&&(b===4||b===3&&(te&130023424)===te&&500>K()-ta?Ft(e,0):ea|=n),ge(e,t)}function Uc(e,t){t===0&&(e.mode&1?(t=Cr,Cr<<=1,!(Cr&130023424)&&(Cr=4194304)):t=1);var n=se();e=tt(e,t),e!==null&&(cr(e,t,n),ge(e,n))}function Mp(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),Uc(e,n)}function Dp(e,t){var n=0;switch(e.tag){case 13:var r=e.stateNode,l=e.memoizedState;l!==null&&(n=l.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(S(314))}r!==null&&r.delete(t),Uc(e,n)}var Bc;Bc=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||he.current)pe=!0;else{if(!(e.lanes&n)&&!(t.flags&128))return pe=!1,Ep(e,t,n);pe=!!(e.flags&131072)}else pe=!1,B&&t.flags&1048576&&Vu(t,ul,t.index);switch(t.lanes=0,t.tag){case 2:var r=t.type;Qr(e,t),e=t.pendingProps;var l=cn(t,ie.current);an(t,n),l=Gi(null,t,r,e,l,n);var o=Xi();return t.flags|=1,typeof l=="object"&&l!==null&&typeof l.render=="function"&&l.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,me(r)?(o=!0,al(t)):o=!1,t.memoizedState=l.state!==null&&l.state!==void 0?l.state:null,Wi(t),l.updater=Tl,t.stateNode=l,l._reactInternals=t,qo(t,r,e,n),t=ni(null,t,r,!0,o,n)):(t.tag=0,B&&o&&Di(t),ae(null,t,l,n),t=t.child),t;case 16:r=t.elementType;e:{switch(Qr(e,t),e=t.pendingProps,l=r._init,r=l(r._payload),t.type=r,l=t.tag=Ap(r),e=Fe(r,e),l){case 0:t=ti(null,t,r,e,n);break e;case 1:t=ds(null,t,r,e,n);break e;case 11:t=us(null,t,r,e,n);break e;case 14:t=cs(null,t,r,Fe(r.type,e),n);break e}throw Error(S(306,r,""))}return t;case 0:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Fe(r,l),ti(e,t,r,l,n);case 1:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Fe(r,l),ds(e,t,r,l,n);case 3:e:{if(Ec(t),e===null)throw Error(S(387));r=t.pendingProps,o=t.memoizedState,l=o.element,bu(e,t),fl(t,r,null,n);var i=t.memoizedState;if(r=i.element,o.isDehydrated)if(o={element:r,isDehydrated:!1,cache:i.cache,pendingSuspenseBoundaries:i.pendingSuspenseBoundaries,transitions:i.transitions},t.updateQueue.baseState=o,t.memoizedState=o,t.flags&256){l=hn(Error(S(423)),t),t=fs(e,t,r,n,l);break e}else if(r!==l){l=hn(Error(S(424)),t),t=fs(e,t,r,n,l);break e}else for(xe=gt(t.stateNode.containerInfo.firstChild),we=t,B=!0,Me=null,n=Gu(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(dn(),r===l){t=nt(e,t,n);break e}ae(e,t,r,n)}t=t.child}return t;case 5:return Ju(t),e===null&&bo(t),r=t.type,l=t.pendingProps,o=e!==null?e.memoizedProps:null,i=l.children,Qo(r,l)?i=null:o!==null&&Qo(r,o)&&(t.flags|=32),Sc(e,t),ae(e,t,i,n),t.child;case 6:return e===null&&bo(t),null;case 13:return Cc(e,t,n);case 4:return Vi(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=fn(t,null,r,n):ae(e,t,r,n),t.child;case 11:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Fe(r,l),us(e,t,r,l,n);case 7:return ae(e,t,t.pendingProps,n),t.child;case 8:return ae(e,t,t.pendingProps.children,n),t.child;case 12:return ae(e,t,t.pendingProps.children,n),t.child;case 10:e:{if(r=t.type._context,l=t.pendingProps,o=t.memoizedProps,i=l.value,I(cl,r._currentValue),r._currentValue=i,o!==null)if(Ae(o.value,i)){if(o.children===l.children&&!he.current){t=nt(e,t,n);break e}}else for(o=t.child,o!==null&&(o.return=t);o!==null;){var a=o.dependencies;if(a!==null){i=o.child;for(var s=a.firstContext;s!==null;){if(s.context===r){if(o.tag===1){s=Je(-1,n&-n),s.tag=2;var c=o.updateQueue;if(c!==null){c=c.shared;var m=c.pending;m===null?s.next=s:(s.next=m.next,m.next=s),c.pending=s}}o.lanes|=n,s=o.alternate,s!==null&&(s.lanes|=n),Jo(o.return,n,t),a.lanes|=n;break}s=s.next}}else if(o.tag===10)i=o.type===t.type?null:o.child;else if(o.tag===18){if(i=o.return,i===null)throw Error(S(341));i.lanes|=n,a=i.alternate,a!==null&&(a.lanes|=n),Jo(i,n,t),i=o.sibling}else i=o.child;if(i!==null)i.return=o;else for(i=o;i!==null;){if(i===t){i=null;break}if(o=i.sibling,o!==null){o.return=i.return,i=o;break}i=i.return}o=i}ae(e,t,l.children,n),t=t.child}return t;case 9:return l=t.type,r=t.pendingProps.children,an(t,n),l=Re(l),r=r(l),t.flags|=1,ae(e,t,r,n),t.child;case 14:return r=t.type,l=Fe(r,t.pendingProps),l=Fe(r.type,l),cs(e,t,r,l,n);case 15:return wc(e,t,t.type,t.pendingProps,n);case 17:return r=t.type,l=t.pendingProps,l=t.elementType===r?l:Fe(r,l),Qr(e,t),t.tag=1,me(r)?(e=!0,al(t)):e=!1,an(t,n),vc(t,r,l),qo(t,r,l,n),ni(null,t,r,!0,e,n);case 19:return jc(e,t,n);case 22:return kc(e,t,n)}throw Error(S(156,t.tag))};function $c(e,t){return hu(e,t)}function Ip(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Ne(e,t,n,r){return new Ip(e,t,n,r)}function oa(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Ap(e){if(typeof e=="function")return oa(e)?1:0;if(e!=null){if(e=e.$$typeof,e===Ci)return 11;if(e===ji)return 14}return 2}function wt(e,t){var n=e.alternate;return n===null?(n=Ne(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function Gr(e,t,n,r,l,o){var i=2;if(r=e,typeof e=="function")oa(e)&&(i=1);else if(typeof e=="string")i=5;else e:switch(e){case Qt:return Ot(n.children,l,o,t);case Ei:i=8,l|=8;break;case Eo:return e=Ne(12,n,t,l|2),e.elementType=Eo,e.lanes=o,e;case Co:return e=Ne(13,n,t,l),e.elementType=Co,e.lanes=o,e;case jo:return e=Ne(19,n,t,l),e.elementType=jo,e.lanes=o,e;case Js:return Ml(n,l,o,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Xs:i=10;break e;case bs:i=9;break e;case Ci:i=11;break e;case ji:i=14;break e;case it:i=16,r=null;break e}throw Error(S(130,e==null?e:typeof e,""))}return t=Ne(i,n,t,l),t.elementType=e,t.type=r,t.lanes=o,t}function Ot(e,t,n,r){return e=Ne(7,e,r,t),e.lanes=n,e}function Ml(e,t,n,r){return e=Ne(22,e,r,t),e.elementType=Js,e.lanes=n,e.stateNode={isHidden:!1},e}function go(e,t,n){return e=Ne(6,e,null,t),e.lanes=n,e}function vo(e,t,n){return t=Ne(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function Up(e,t,n,r,l){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=bl(0),this.expirationTimes=bl(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=bl(0),this.identifierPrefix=r,this.onRecoverableError=l,this.mutableSourceEagerHydrationData=null}function ia(e,t,n,r,l,o,i,a,s){return e=new Up(e,t,n,a,s),t===1?(t=1,o===!0&&(t|=8)):t=0,o=Ne(3,null,null,t),e.current=o,o.stateNode=e,o.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},Wi(o),e}function Bp(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Vt,key:r==null?null:""+r,children:e,containerInfo:t,implementation:n}}function Hc(e){if(!e)return St;e=e._reactInternals;e:{if($t(e)!==e||e.tag!==1)throw Error(S(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(me(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(S(171))}if(e.tag===1){var n=e.type;if(me(n))return Hu(e,n,t)}return t}function Wc(e,t,n,r,l,o,i,a,s){return e=ia(n,r,!0,e,l,o,i,a,s),e.context=Hc(null),n=e.current,r=se(),l=xt(n),o=Je(r,l),o.callback=t??null,vt(n,o,l),e.current.lanes=l,cr(e,l,r),ge(e,r),e}function Dl(e,t,n,r){var l=t.current,o=se(),i=xt(l);return n=Hc(n),t.context===null?t.context=n:t.pendingContext=n,t=Je(o,i),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=vt(l,t,i),e!==null&&(Ie(e,l,i,o),Hr(e,l,i)),i}function wl(e){if(e=e.current,!e.child)return null;switch(e.child.tag){case 5:return e.child.stateNode;default:return e.child.stateNode}}function Ss(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function aa(e,t){Ss(e,t),(e=e.alternate)&&Ss(e,t)}function $p(){return null}var Vc=typeof reportError=="function"?reportError:function(e){console.error(e)};function sa(e){this._internalRoot=e}Il.prototype.render=sa.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(S(409));Dl(e,t,null,null)};Il.prototype.unmount=sa.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Ut(function(){Dl(null,e,null,null)}),t[et]=null}};function Il(e){this._internalRoot=e}Il.prototype.unstable_scheduleHydration=function(e){if(e){var t=ku();e={blockedOn:null,target:e,priority:t};for(var n=0;n<st.length&&t!==0&&t<st[n].priority;n++);st.splice(n,0,e),n===0&&Eu(e)}};function ua(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Al(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Es(){}function Hp(e,t,n,r,l){if(l){if(typeof r=="function"){var o=r;r=function(){var c=wl(i);o.call(c)}}var i=Wc(t,r,e,0,null,!1,!1,"",Es);return e._reactRootContainer=i,e[et]=i.current,qn(e.nodeType===8?e.parentNode:e),Ut(),i}for(;l=e.lastChild;)e.removeChild(l);if(typeof r=="function"){var a=r;r=function(){var c=wl(s);a.call(c)}}var s=ia(e,0,!1,null,null,!1,!1,"",Es);return e._reactRootContainer=s,e[et]=s.current,qn(e.nodeType===8?e.parentNode:e),Ut(function(){Dl(t,s,n,r)}),s}function Ul(e,t,n,r,l){var o=n._reactRootContainer;if(o){var i=o;if(typeof l=="function"){var a=l;l=function(){var s=wl(i);a.call(s)}}Dl(t,i,e,l)}else i=Hp(n,t,e,l,r);return wl(i)}xu=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=On(t.pendingLanes);n!==0&&(Ri(t,n|1),ge(t,K()),!(O&6)&&(mn=K()+500,jt()))}break;case 13:Ut(function(){var r=tt(e,1);if(r!==null){var l=se();Ie(r,e,1,l)}}),aa(e,1)}};zi=function(e){if(e.tag===13){var t=tt(e,134217728);if(t!==null){var n=se();Ie(t,e,134217728,n)}aa(e,134217728)}};wu=function(e){if(e.tag===13){var t=xt(e),n=tt(e,t);if(n!==null){var r=se();Ie(n,e,t,r)}aa(e,t)}};ku=function(){return M};Su=function(e,t){var n=M;try{return M=e,t()}finally{M=n}};Mo=function(e,t,n){switch(t){case"input":if(Ro(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var l=zl(r);if(!l)throw Error(S(90));qs(r),Ro(r,l)}}}break;case"textarea":tu(e,n);break;case"select":t=n.value,t!=null&&nn(e,!!n.multiple,t,!1)}};su=na;uu=Ut;var Wp={usingClientEntryPoint:!1,Events:[fr,Xt,zl,iu,au,na]},_n={findFiberByHostInstance:_t,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Vp={bundleType:_n.bundleType,version:_n.version,rendererPackageName:_n.rendererPackageName,rendererConfig:_n.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:lt.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=fu(e),e===null?null:e.stateNode},findFiberByHostInstance:_n.findFiberByHostInstance||$p,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Mr=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Mr.isDisabled&&Mr.supportsFiber)try{jl=Mr.inject(Vp),We=Mr}catch{}}Se.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Wp;Se.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!ua(t))throw Error(S(200));return Bp(e,t,null,n)};Se.createRoot=function(e,t){if(!ua(e))throw Error(S(299));var n=!1,r="",l=Vc;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onRecoverableError!==void 0&&(l=t.onRecoverableError)),t=ia(e,1,!1,null,null,n,!1,r,l),e[et]=t.current,qn(e.nodeType===8?e.parentNode:e),new sa(t)};Se.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(S(188)):(e=Object.keys(e).join(","),Error(S(268,e)));return e=fu(t),e=e===null?null:e.stateNode,e};Se.flushSync=function(e){return Ut(e)};Se.hydrate=function(e,t,n){if(!Al(t))throw Error(S(200));return Ul(null,e,t,!0,n)};Se.hydrateRoot=function(e,t,n){if(!ua(e))throw Error(S(405));var r=n!=null&&n.hydratedSources||null,l=!1,o="",i=Vc;if(n!=null&&(n.unstable_strictMode===!0&&(l=!0),n.identifierPrefix!==void 0&&(o=n.identifierPrefix),n.onRecoverableError!==void 0&&(i=n.onRecoverableError)),t=Wc(t,null,e,1,n??null,l,!1,o,i),e[et]=t.current,qn(e),r)for(e=0;e<r.length;e++)n=r[e],l=n._getVersion,l=l(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,l]:t.mutableSourceEagerHydrationData.push(n,l);return new Il(t)};Se.render=function(e,t,n){if(!Al(t))throw Error(S(200));return Ul(null,e,t,!1,n)};Se.unmountComponentAtNode=function(e){if(!Al(e))throw Error(S(40));return e._reactRootContainer?(Ut(function(){Ul(null,null,e,!1,function(){e._reactRootContainer=null,e[et]=null})}),!0):!1};Se.unstable_batchedUpdates=na;Se.unstable_renderSubtreeIntoContainer=function(e,t,n,r){if(!Al(n))throw Error(S(200));if(e==null||e._reactInternals===void 0)throw Error(S(38));return Ul(e,t,n,!1,r)};Se.version="18.3.1-next-f1338f8080-20240426";function Qc(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Qc)}catch(e){console.error(e)}}Qc(),Qs.exports=Se;var Qp=Qs.exports,Cs=Qp;ko.createRoot=Cs.createRoot,ko.hydrateRoot=Cs.hydrateRoot;/**
 * react-router v7.11.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */var js="popstate";function Yp(e={}){function t(r,l){let{pathname:o,search:i,hash:a}=r.location;return hi("",{pathname:o,search:i,hash:a},l.state&&l.state.usr||null,l.state&&l.state.key||"default")}function n(r,l){return typeof l=="string"?l:sr(l)}return Gp(t,n,null,e)}function W(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}function Ue(e,t){if(!e){typeof console<"u"&&console.warn(t);try{throw new Error(t)}catch{}}}function Kp(){return Math.random().toString(36).substring(2,10)}function Ns(e,t){return{usr:e.state,key:e.key,idx:t}}function hi(e,t,n=null,r){return{pathname:typeof e=="string"?e:e.pathname,search:"",hash:"",...typeof t=="string"?xn(t):t,state:n,key:t&&t.key||r||Kp()}}function sr({pathname:e="/",search:t="",hash:n=""}){return t&&t!=="?"&&(e+=t.charAt(0)==="?"?t:"?"+t),n&&n!=="#"&&(e+=n.charAt(0)==="#"?n:"#"+n),e}function xn(e){let t={};if(e){let n=e.indexOf("#");n>=0&&(t.hash=e.substring(n),e=e.substring(0,n));let r=e.indexOf("?");r>=0&&(t.search=e.substring(r),e=e.substring(0,r)),e&&(t.pathname=e)}return t}function Gp(e,t,n,r={}){let{window:l=document.defaultView,v5Compat:o=!1}=r,i=l.history,a="POP",s=null,c=m();c==null&&(c=0,i.replaceState({...i.state,idx:c},""));function m(){return(i.state||{idx:null}).idx}function h(){a="POP";let C=m(),f=C==null?null:C-c;c=C,s&&s({action:a,location:k.location,delta:f})}function g(C,f){a="PUSH";let d=hi(k.location,C,f);c=m()+1;let p=Ns(d,c),w=k.createHref(d);try{i.pushState(p,"",w)}catch(E){if(E instanceof DOMException&&E.name==="DataCloneError")throw E;l.location.assign(w)}o&&s&&s({action:a,location:k.location,delta:1})}function y(C,f){a="REPLACE";let d=hi(k.location,C,f);c=m();let p=Ns(d,c),w=k.createHref(d);i.replaceState(p,"",w),o&&s&&s({action:a,location:k.location,delta:0})}function x(C){return Xp(C)}let k={get action(){return a},get location(){return e(l,i)},listen(C){if(s)throw new Error("A history only accepts one active listener");return l.addEventListener(js,h),s=C,()=>{l.removeEventListener(js,h),s=null}},createHref(C){return t(l,C)},createURL:x,encodeLocation(C){let f=x(C);return{pathname:f.pathname,search:f.search,hash:f.hash}},push:g,replace:y,go(C){return i.go(C)}};return k}function Xp(e,t=!1){let n="http://localhost";typeof window<"u"&&(n=window.location.origin!=="null"?window.location.origin:window.location.href),W(n,"No window.location.(origin|href) available to create URL");let r=typeof e=="string"?e:sr(e);return r=r.replace(/ $/,"%20"),!t&&r.startsWith("//")&&(r=n+r),new URL(r,n)}function Yc(e,t,n="/"){return bp(e,t,n,!1)}function bp(e,t,n,r){let l=typeof t=="string"?xn(t):t,o=rt(l.pathname||"/",n);if(o==null)return null;let i=Kc(e);Jp(i);let a=null;for(let s=0;a==null&&s<i.length;++s){let c=sh(o);a=ih(i[s],c,r)}return a}function Kc(e,t=[],n=[],r="",l=!1){let o=(i,a,s=l,c)=>{let m={relativePath:c===void 0?i.path||"":c,caseSensitive:i.caseSensitive===!0,childrenIndex:a,route:i};if(m.relativePath.startsWith("/")){if(!m.relativePath.startsWith(r)&&s)return;W(m.relativePath.startsWith(r),`Absolute route path "${m.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),m.relativePath=m.relativePath.slice(r.length)}let h=Ze([r,m.relativePath]),g=n.concat(m);i.children&&i.children.length>0&&(W(i.index!==!0,`Index routes must not have child routes. Please remove all child routes from route path "${h}".`),Kc(i.children,t,g,h,s)),!(i.path==null&&!i.index)&&t.push({path:h,score:lh(h,i.index),routesMeta:g})};return e.forEach((i,a)=>{var s;if(i.path===""||!((s=i.path)!=null&&s.includes("?")))o(i,a);else for(let c of Gc(i.path))o(i,a,!0,c)}),t}function Gc(e){let t=e.split("/");if(t.length===0)return[];let[n,...r]=t,l=n.endsWith("?"),o=n.replace(/\?$/,"");if(r.length===0)return l?[o,""]:[o];let i=Gc(r.join("/")),a=[];return a.push(...i.map(s=>s===""?o:[o,s].join("/"))),l&&a.push(...i),a.map(s=>e.startsWith("/")&&s===""?"/":s)}function Jp(e){e.sort((t,n)=>t.score!==n.score?n.score-t.score:oh(t.routesMeta.map(r=>r.childrenIndex),n.routesMeta.map(r=>r.childrenIndex)))}var Zp=/^:[\w-]+$/,qp=3,eh=2,th=1,nh=10,rh=-2,Ps=e=>e==="*";function lh(e,t){let n=e.split("/"),r=n.length;return n.some(Ps)&&(r+=rh),t&&(r+=eh),n.filter(l=>!Ps(l)).reduce((l,o)=>l+(Zp.test(o)?qp:o===""?th:nh),r)}function oh(e,t){return e.length===t.length&&e.slice(0,-1).every((r,l)=>r===t[l])?e[e.length-1]-t[t.length-1]:0}function ih(e,t,n=!1){let{routesMeta:r}=e,l={},o="/",i=[];for(let a=0;a<r.length;++a){let s=r[a],c=a===r.length-1,m=o==="/"?t:t.slice(o.length)||"/",h=kl({path:s.relativePath,caseSensitive:s.caseSensitive,end:c},m),g=s.route;if(!h&&c&&n&&!r[r.length-1].route.index&&(h=kl({path:s.relativePath,caseSensitive:s.caseSensitive,end:!1},m)),!h)return null;Object.assign(l,h.params),i.push({params:l,pathname:Ze([o,h.pathname]),pathnameBase:fh(Ze([o,h.pathnameBase])),route:g}),h.pathnameBase!=="/"&&(o=Ze([o,h.pathnameBase]))}return i}function kl(e,t){typeof e=="string"&&(e={path:e,caseSensitive:!1,end:!0});let[n,r]=ah(e.path,e.caseSensitive,e.end),l=t.match(n);if(!l)return null;let o=l[0],i=o.replace(/(.)\/+$/,"$1"),a=l.slice(1);return{params:r.reduce((c,{paramName:m,isOptional:h},g)=>{if(m==="*"){let x=a[g]||"";i=o.slice(0,o.length-x.length).replace(/(.)\/+$/,"$1")}const y=a[g];return h&&!y?c[m]=void 0:c[m]=(y||"").replace(/%2F/g,"/"),c},{}),pathname:o,pathnameBase:i,pattern:e}}function ah(e,t=!1,n=!0){Ue(e==="*"||!e.endsWith("*")||e.endsWith("/*"),`Route path "${e}" will be treated as if it were "${e.replace(/\*$/,"/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/,"/*")}".`);let r=[],l="^"+e.replace(/\/*\*?$/,"").replace(/^\/*/,"/").replace(/[\\.*+^${}|()[\]]/g,"\\$&").replace(/\/:([\w-]+)(\?)?/g,(i,a,s)=>(r.push({paramName:a,isOptional:s!=null}),s?"/?([^\\/]+)?":"/([^\\/]+)")).replace(/\/([\w-]+)\?(\/|$)/g,"(/$1)?$2");return e.endsWith("*")?(r.push({paramName:"*"}),l+=e==="*"||e==="/*"?"(.*)$":"(?:\\/(.+)|\\/*)$"):n?l+="\\/*$":e!==""&&e!=="/"&&(l+="(?:(?=\\/|$))"),[new RegExp(l,t?void 0:"i"),r]}function sh(e){try{return e.split("/").map(t=>decodeURIComponent(t).replace(/\//g,"%2F")).join("/")}catch(t){return Ue(!1,`The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`),e}}function rt(e,t){if(t==="/")return e;if(!e.toLowerCase().startsWith(t.toLowerCase()))return null;let n=t.endsWith("/")?t.length-1:t.length,r=e.charAt(n);return r&&r!=="/"?null:e.slice(n)||"/"}var Xc=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,uh=e=>Xc.test(e);function ch(e,t="/"){let{pathname:n,search:r="",hash:l=""}=typeof e=="string"?xn(e):e,o;if(n)if(uh(n))o=n;else{if(n.includes("//")){let i=n;n=n.replace(/\/\/+/g,"/"),Ue(!1,`Pathnames cannot have embedded double slashes - normalizing ${i} -> ${n}`)}n.startsWith("/")?o=Rs(n.substring(1),"/"):o=Rs(n,t)}else o=t;return{pathname:o,search:ph(r),hash:hh(l)}}function Rs(e,t){let n=t.replace(/\/+$/,"").split("/");return e.split("/").forEach(l=>{l===".."?n.length>1&&n.pop():l!=="."&&n.push(l)}),n.length>1?n.join("/"):"/"}function yo(e,t,n,r){return`Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`}function dh(e){return e.filter((t,n)=>n===0||t.route.path&&t.route.path.length>0)}function bc(e){let t=dh(e);return t.map((n,r)=>r===t.length-1?n.pathname:n.pathnameBase)}function Jc(e,t,n,r=!1){let l;typeof e=="string"?l=xn(e):(l={...e},W(!l.pathname||!l.pathname.includes("?"),yo("?","pathname","search",l)),W(!l.pathname||!l.pathname.includes("#"),yo("#","pathname","hash",l)),W(!l.search||!l.search.includes("#"),yo("#","search","hash",l)));let o=e===""||l.pathname==="",i=o?"/":l.pathname,a;if(i==null)a=n;else{let h=t.length-1;if(!r&&i.startsWith("..")){let g=i.split("/");for(;g[0]==="..";)g.shift(),h-=1;l.pathname=g.join("/")}a=h>=0?t[h]:"/"}let s=ch(l,a),c=i&&i!=="/"&&i.endsWith("/"),m=(o||i===".")&&n.endsWith("/");return!s.pathname.endsWith("/")&&(c||m)&&(s.pathname+="/"),s}var Ze=e=>e.join("/").replace(/\/\/+/g,"/"),fh=e=>e.replace(/\/+$/,"").replace(/^\/*/,"/"),ph=e=>!e||e==="?"?"":e.startsWith("?")?e:"?"+e,hh=e=>!e||e==="#"?"":e.startsWith("#")?e:"#"+e,mh=class{constructor(e,t,n,r=!1){this.status=e,this.statusText=t||"",this.internal=r,n instanceof Error?(this.data=n.toString(),this.error=n):this.data=n}};function gh(e){return e!=null&&typeof e.status=="number"&&typeof e.statusText=="string"&&typeof e.internal=="boolean"&&"data"in e}function vh(e){return e.map(t=>t.route.path).filter(Boolean).join("/").replace(/\/\/*/g,"/")||"/"}var Zc=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";function qc(e,t){let n=e;if(typeof n!="string"||!Xc.test(n))return{absoluteURL:void 0,isExternal:!1,to:n};let r=n,l=!1;if(Zc)try{let o=new URL(window.location.href),i=n.startsWith("//")?new URL(o.protocol+n):new URL(n),a=rt(i.pathname,t);i.origin===o.origin&&a!=null?n=a+i.search+i.hash:l=!0}catch{Ue(!1,`<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)}return{absoluteURL:r,isExternal:l,to:n}}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");var ed=["POST","PUT","PATCH","DELETE"];new Set(ed);var yh=["GET",...ed];new Set(yh);var wn=v.createContext(null);wn.displayName="DataRouter";var Bl=v.createContext(null);Bl.displayName="DataRouterState";var xh=v.createContext(!1),td=v.createContext({isTransitioning:!1});td.displayName="ViewTransition";var wh=v.createContext(new Map);wh.displayName="Fetchers";var kh=v.createContext(null);kh.displayName="Await";var _e=v.createContext(null);_e.displayName="Navigation";var hr=v.createContext(null);hr.displayName="Location";var Qe=v.createContext({outlet:null,matches:[],isDataRoute:!1});Qe.displayName="Route";var ca=v.createContext(null);ca.displayName="RouteError";var nd="REACT_ROUTER_ERROR",Sh="REDIRECT",Eh="ROUTE_ERROR_RESPONSE";function Ch(e){if(e.startsWith(`${nd}:${Sh}:{`))try{let t=JSON.parse(e.slice(28));if(typeof t=="object"&&t&&typeof t.status=="number"&&typeof t.statusText=="string"&&typeof t.location=="string"&&typeof t.reloadDocument=="boolean"&&typeof t.replace=="boolean")return t}catch{}}function jh(e){if(e.startsWith(`${nd}:${Eh}:{`))try{let t=JSON.parse(e.slice(40));if(typeof t=="object"&&t&&typeof t.status=="number"&&typeof t.statusText=="string")return new mh(t.status,t.statusText,t.data)}catch{}}function Nh(e,{relative:t}={}){W(mr(),"useHref() may be used only in the context of a <Router> component.");let{basename:n,navigator:r}=v.useContext(_e),{hash:l,pathname:o,search:i}=gr(e,{relative:t}),a=o;return n!=="/"&&(a=o==="/"?n:Ze([n,o])),r.createHref({pathname:a,search:i,hash:l})}function mr(){return v.useContext(hr)!=null}function Ht(){return W(mr(),"useLocation() may be used only in the context of a <Router> component."),v.useContext(hr).location}var rd="You should call navigate() in a React.useEffect(), not when your component is first rendered.";function ld(e){v.useContext(_e).static||v.useLayoutEffect(e)}function Ph(){let{isDataRoute:e}=v.useContext(Qe);return e?Hh():Rh()}function Rh(){W(mr(),"useNavigate() may be used only in the context of a <Router> component.");let e=v.useContext(wn),{basename:t,navigator:n}=v.useContext(_e),{matches:r}=v.useContext(Qe),{pathname:l}=Ht(),o=JSON.stringify(bc(r)),i=v.useRef(!1);return ld(()=>{i.current=!0}),v.useCallback((s,c={})=>{if(Ue(i.current,rd),!i.current)return;if(typeof s=="number"){n.go(s);return}let m=Jc(s,JSON.parse(o),l,c.relative==="path");e==null&&t!=="/"&&(m.pathname=m.pathname==="/"?t:Ze([t,m.pathname])),(c.replace?n.replace:n.push)(m,c.state,c)},[t,n,o,l,e])}var zh=v.createContext(null);function _h(e){let t=v.useContext(Qe).outlet;return v.useMemo(()=>t&&v.createElement(zh.Provider,{value:e},t),[t,e])}function gr(e,{relative:t}={}){let{matches:n}=v.useContext(Qe),{pathname:r}=Ht(),l=JSON.stringify(bc(n));return v.useMemo(()=>Jc(e,JSON.parse(l),r,t==="path"),[e,l,r,t])}function Lh(e,t){return od(e,t)}function od(e,t,n,r,l){var d;W(mr(),"useRoutes() may be used only in the context of a <Router> component.");let{navigator:o}=v.useContext(_e),{matches:i}=v.useContext(Qe),a=i[i.length-1],s=a?a.params:{},c=a?a.pathname:"/",m=a?a.pathnameBase:"/",h=a&&a.route;{let p=h&&h.path||"";ad(c,!h||p.endsWith("*")||p.endsWith("*?"),`You rendered descendant <Routes> (or called \`useRoutes()\`) at "${c}" (under <Route path="${p}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${p}"> to <Route path="${p==="/"?"*":`${p}/*`}">.`)}let g=Ht(),y;if(t){let p=typeof t=="string"?xn(t):t;W(m==="/"||((d=p.pathname)==null?void 0:d.startsWith(m)),`When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${m}" but pathname "${p.pathname}" was given in the \`location\` prop.`),y=p}else y=g;let x=y.pathname||"/",k=x;if(m!=="/"){let p=m.replace(/^\//,"").split("/");k="/"+x.replace(/^\//,"").split("/").slice(p.length).join("/")}let C=Yc(e,{pathname:k});Ue(h||C!=null,`No routes matched location "${y.pathname}${y.search}${y.hash}" `),Ue(C==null||C[C.length-1].route.element!==void 0||C[C.length-1].route.Component!==void 0||C[C.length-1].route.lazy!==void 0,`Matched leaf route at location "${y.pathname}${y.search}${y.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`);let f=Dh(C&&C.map(p=>Object.assign({},p,{params:Object.assign({},s,p.params),pathname:Ze([m,o.encodeLocation?o.encodeLocation(p.pathname.replace(/\?/g,"%3F").replace(/#/g,"%23")).pathname:p.pathname]),pathnameBase:p.pathnameBase==="/"?m:Ze([m,o.encodeLocation?o.encodeLocation(p.pathnameBase.replace(/\?/g,"%3F").replace(/#/g,"%23")).pathname:p.pathnameBase])})),i,n,r,l);return t&&f?v.createElement(hr.Provider,{value:{location:{pathname:"/",search:"",hash:"",state:null,key:"default",...y},navigationType:"POP"}},f):f}function Th(){let e=$h(),t=gh(e)?`${e.status} ${e.statusText}`:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,r="rgba(200,200,200, 0.5)",l={padding:"0.5rem",backgroundColor:r},o={padding:"2px 4px",backgroundColor:r},i=null;return console.error("Error handled by React Router default ErrorBoundary:",e),i=v.createElement(v.Fragment,null,v.createElement("p",null,"💿 Hey developer 👋"),v.createElement("p",null,"You can provide a way better UX than this when your app throws errors by providing your own ",v.createElement("code",{style:o},"ErrorBoundary")," or"," ",v.createElement("code",{style:o},"errorElement")," prop on your route.")),v.createElement(v.Fragment,null,v.createElement("h2",null,"Unexpected Application Error!"),v.createElement("h3",{style:{fontStyle:"italic"}},t),n?v.createElement("pre",{style:l},n):null,i)}var Fh=v.createElement(Th,null),id=class extends v.Component{constructor(e){super(e),this.state={location:e.location,revalidation:e.revalidation,error:e.error}}static getDerivedStateFromError(e){return{error:e}}static getDerivedStateFromProps(e,t){return t.location!==e.location||t.revalidation!=="idle"&&e.revalidation==="idle"?{error:e.error,location:e.location,revalidation:e.revalidation}:{error:e.error!==void 0?e.error:t.error,location:t.location,revalidation:e.revalidation||t.revalidation}}componentDidCatch(e,t){this.props.onError?this.props.onError(e,t):console.error("React Router caught the following error during render",e)}render(){let e=this.state.error;if(this.context&&typeof e=="object"&&e&&"digest"in e&&typeof e.digest=="string"){const n=jh(e.digest);n&&(e=n)}let t=e!==void 0?v.createElement(Qe.Provider,{value:this.props.routeContext},v.createElement(ca.Provider,{value:e,children:this.props.component})):this.props.children;return this.context?v.createElement(Oh,{error:e},t):t}};id.contextType=xh;var xo=new WeakMap;function Oh({children:e,error:t}){let{basename:n}=v.useContext(_e);if(typeof t=="object"&&t&&"digest"in t&&typeof t.digest=="string"){let r=Ch(t.digest);if(r){let l=xo.get(t);if(l)throw l;let o=qc(r.location,n);if(Zc&&!xo.get(t))if(o.isExternal||r.reloadDocument)window.location.href=o.absoluteURL||o.to;else{const i=Promise.resolve().then(()=>window.__reactRouterDataRouter.navigate(o.to,{replace:r.replace}));throw xo.set(t,i),i}return v.createElement("meta",{httpEquiv:"refresh",content:`0;url=${o.absoluteURL||o.to}`})}}return e}function Mh({routeContext:e,match:t,children:n}){let r=v.useContext(wn);return r&&r.static&&r.staticContext&&(t.route.errorElement||t.route.ErrorBoundary)&&(r.staticContext._deepestRenderedBoundaryId=t.route.id),v.createElement(Qe.Provider,{value:e},n)}function Dh(e,t=[],n=null,r=null,l=null){if(e==null){if(!n)return null;if(n.errors)e=n.matches;else if(t.length===0&&!n.initialized&&n.matches.length>0)e=n.matches;else return null}let o=e,i=n==null?void 0:n.errors;if(i!=null){let m=o.findIndex(h=>h.route.id&&(i==null?void 0:i[h.route.id])!==void 0);W(m>=0,`Could not find a matching route for errors on route IDs: ${Object.keys(i).join(",")}`),o=o.slice(0,Math.min(o.length,m+1))}let a=!1,s=-1;if(n)for(let m=0;m<o.length;m++){let h=o[m];if((h.route.HydrateFallback||h.route.hydrateFallbackElement)&&(s=m),h.route.id){let{loaderData:g,errors:y}=n,x=h.route.loader&&!g.hasOwnProperty(h.route.id)&&(!y||y[h.route.id]===void 0);if(h.route.lazy||x){a=!0,s>=0?o=o.slice(0,s+1):o=[o[0]];break}}}let c=n&&r?(m,h)=>{var g,y;r(m,{location:n.location,params:((y=(g=n.matches)==null?void 0:g[0])==null?void 0:y.params)??{},unstable_pattern:vh(n.matches),errorInfo:h})}:void 0;return o.reduceRight((m,h,g)=>{let y,x=!1,k=null,C=null;n&&(y=i&&h.route.id?i[h.route.id]:void 0,k=h.route.errorElement||Fh,a&&(s<0&&g===0?(ad("route-fallback",!1,"No `HydrateFallback` element provided to render during initial hydration"),x=!0,C=null):s===g&&(x=!0,C=h.route.hydrateFallbackElement||null)));let f=t.concat(o.slice(0,g+1)),d=()=>{let p;return y?p=k:x?p=C:h.route.Component?p=v.createElement(h.route.Component,null):h.route.element?p=h.route.element:p=m,v.createElement(Mh,{match:h,routeContext:{outlet:m,matches:f,isDataRoute:n!=null},children:p})};return n&&(h.route.ErrorBoundary||h.route.errorElement||g===0)?v.createElement(id,{location:n.location,revalidation:n.revalidation,component:k,error:y,children:d(),routeContext:{outlet:null,matches:f,isDataRoute:!0},onError:c}):d()},null)}function da(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function Ih(e){let t=v.useContext(wn);return W(t,da(e)),t}function Ah(e){let t=v.useContext(Bl);return W(t,da(e)),t}function Uh(e){let t=v.useContext(Qe);return W(t,da(e)),t}function fa(e){let t=Uh(e),n=t.matches[t.matches.length-1];return W(n.route.id,`${e} can only be used on routes that contain a unique "id"`),n.route.id}function Bh(){return fa("useRouteId")}function $h(){var r;let e=v.useContext(ca),t=Ah("useRouteError"),n=fa("useRouteError");return e!==void 0?e:(r=t.errors)==null?void 0:r[n]}function Hh(){let{router:e}=Ih("useNavigate"),t=fa("useNavigate"),n=v.useRef(!1);return ld(()=>{n.current=!0}),v.useCallback(async(l,o={})=>{Ue(n.current,rd),n.current&&(typeof l=="number"?await e.navigate(l):await e.navigate(l,{fromRouteId:t,...o}))},[e,t])}var zs={};function ad(e,t,n){!t&&!zs[e]&&(zs[e]=!0,Ue(!1,n))}v.memo(Wh);function Wh({routes:e,future:t,state:n,onError:r}){return od(e,void 0,n,r,t)}function Vh(e){return _h(e.context)}function Ye(e){W(!1,"A <Route> is only ever to be used as the child of <Routes> element, never rendered directly. Please wrap your <Route> in a <Routes>.")}function Qh({basename:e="/",children:t=null,location:n,navigationType:r="POP",navigator:l,static:o=!1,unstable_useTransitions:i}){W(!mr(),"You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");let a=e.replace(/^\/*/,"/"),s=v.useMemo(()=>({basename:a,navigator:l,static:o,unstable_useTransitions:i,future:{}}),[a,l,o,i]);typeof n=="string"&&(n=xn(n));let{pathname:c="/",search:m="",hash:h="",state:g=null,key:y="default"}=n,x=v.useMemo(()=>{let k=rt(c,a);return k==null?null:{location:{pathname:k,search:m,hash:h,state:g,key:y},navigationType:r}},[a,c,m,h,g,y,r]);return Ue(x!=null,`<Router basename="${a}"> is not able to match the URL "${c}${m}${h}" because it does not start with the basename, so the <Router> won't render anything.`),x==null?null:v.createElement(_e.Provider,{value:s},v.createElement(hr.Provider,{children:t,value:x}))}function Yh({children:e,location:t}){return Lh(mi(e),t)}function mi(e,t=[]){let n=[];return v.Children.forEach(e,(r,l)=>{if(!v.isValidElement(r))return;let o=[...t,l];if(r.type===v.Fragment){n.push.apply(n,mi(r.props.children,o));return}W(r.type===Ye,`[${typeof r.type=="string"?r.type:r.type.name}] is not a <Route> component. All component children of <Routes> must be a <Route> or <React.Fragment>`),W(!r.props.index||!r.props.children,"An index route cannot have child routes.");let i={id:r.props.id||o.join("-"),caseSensitive:r.props.caseSensitive,element:r.props.element,Component:r.props.Component,index:r.props.index,path:r.props.path,middleware:r.props.middleware,loader:r.props.loader,action:r.props.action,hydrateFallbackElement:r.props.hydrateFallbackElement,HydrateFallback:r.props.HydrateFallback,errorElement:r.props.errorElement,ErrorBoundary:r.props.ErrorBoundary,hasErrorBoundary:r.props.hasErrorBoundary===!0||r.props.ErrorBoundary!=null||r.props.errorElement!=null,shouldRevalidate:r.props.shouldRevalidate,handle:r.props.handle,lazy:r.props.lazy};r.props.children&&(i.children=mi(r.props.children,o)),n.push(i)}),n}var Xr="get",br="application/x-www-form-urlencoded";function $l(e){return typeof HTMLElement<"u"&&e instanceof HTMLElement}function Kh(e){return $l(e)&&e.tagName.toLowerCase()==="button"}function Gh(e){return $l(e)&&e.tagName.toLowerCase()==="form"}function Xh(e){return $l(e)&&e.tagName.toLowerCase()==="input"}function bh(e){return!!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)}function Jh(e,t){return e.button===0&&(!t||t==="_self")&&!bh(e)}var Dr=null;function Zh(){if(Dr===null)try{new FormData(document.createElement("form"),0),Dr=!1}catch{Dr=!0}return Dr}var qh=new Set(["application/x-www-form-urlencoded","multipart/form-data","text/plain"]);function wo(e){return e!=null&&!qh.has(e)?(Ue(!1,`"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${br}"`),null):e}function em(e,t){let n,r,l,o,i;if(Gh(e)){let a=e.getAttribute("action");r=a?rt(a,t):null,n=e.getAttribute("method")||Xr,l=wo(e.getAttribute("enctype"))||br,o=new FormData(e)}else if(Kh(e)||Xh(e)&&(e.type==="submit"||e.type==="image")){let a=e.form;if(a==null)throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');let s=e.getAttribute("formaction")||a.getAttribute("action");if(r=s?rt(s,t):null,n=e.getAttribute("formmethod")||a.getAttribute("method")||Xr,l=wo(e.getAttribute("formenctype"))||wo(a.getAttribute("enctype"))||br,o=new FormData(a,e),!Zh()){let{name:c,type:m,value:h}=e;if(m==="image"){let g=c?`${c}.`:"";o.append(`${g}x`,"0"),o.append(`${g}y`,"0")}else c&&o.append(c,h)}}else{if($l(e))throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');n=Xr,r=null,l=br,i=e}return o&&l==="text/plain"&&(i=o,o=void 0),{action:r,method:n.toLowerCase(),encType:l,formData:o,body:i}}Object.getOwnPropertyNames(Object.prototype).sort().join("\0");function pa(e,t){if(e===!1||e===null||typeof e>"u")throw new Error(t)}function tm(e,t,n){let r=typeof e=="string"?new URL(e,typeof window>"u"?"server://singlefetch/":window.location.origin):e;return r.pathname==="/"?r.pathname=`_root.${n}`:t&&rt(r.pathname,t)==="/"?r.pathname=`${t.replace(/\/$/,"")}/_root.${n}`:r.pathname=`${r.pathname.replace(/\/$/,"")}.${n}`,r}async function nm(e,t){if(e.id in t)return t[e.id];try{let n=await import(e.module);return t[e.id]=n,n}catch(n){return console.error(`Error loading route module \`${e.module}\`, reloading page...`),console.error(n),window.__reactRouterContext&&window.__reactRouterContext.isSpaMode,window.location.reload(),new Promise(()=>{})}}function rm(e){return e==null?!1:e.href==null?e.rel==="preload"&&typeof e.imageSrcSet=="string"&&typeof e.imageSizes=="string":typeof e.rel=="string"&&typeof e.href=="string"}async function lm(e,t,n){let r=await Promise.all(e.map(async l=>{let o=t.routes[l.route.id];if(o){let i=await nm(o,n);return i.links?i.links():[]}return[]}));return sm(r.flat(1).filter(rm).filter(l=>l.rel==="stylesheet"||l.rel==="preload").map(l=>l.rel==="stylesheet"?{...l,rel:"prefetch",as:"style"}:{...l,rel:"prefetch"}))}function _s(e,t,n,r,l,o){let i=(s,c)=>n[c]?s.route.id!==n[c].route.id:!0,a=(s,c)=>{var m;return n[c].pathname!==s.pathname||((m=n[c].route.path)==null?void 0:m.endsWith("*"))&&n[c].params["*"]!==s.params["*"]};return o==="assets"?t.filter((s,c)=>i(s,c)||a(s,c)):o==="data"?t.filter((s,c)=>{var h;let m=r.routes[s.route.id];if(!m||!m.hasLoader)return!1;if(i(s,c)||a(s,c))return!0;if(s.route.shouldRevalidate){let g=s.route.shouldRevalidate({currentUrl:new URL(l.pathname+l.search+l.hash,window.origin),currentParams:((h=n[0])==null?void 0:h.params)||{},nextUrl:new URL(e,window.origin),nextParams:s.params,defaultShouldRevalidate:!0});if(typeof g=="boolean")return g}return!0}):[]}function om(e,t,{includeHydrateFallback:n}={}){return im(e.map(r=>{let l=t.routes[r.route.id];if(!l)return[];let o=[l.module];return l.clientActionModule&&(o=o.concat(l.clientActionModule)),l.clientLoaderModule&&(o=o.concat(l.clientLoaderModule)),n&&l.hydrateFallbackModule&&(o=o.concat(l.hydrateFallbackModule)),l.imports&&(o=o.concat(l.imports)),o}).flat(1))}function im(e){return[...new Set(e)]}function am(e){let t={},n=Object.keys(e).sort();for(let r of n)t[r]=e[r];return t}function sm(e,t){let n=new Set;return new Set(t),e.reduce((r,l)=>{let o=JSON.stringify(am(l));return n.has(o)||(n.add(o),r.push({key:o,link:l})),r},[])}function sd(){let e=v.useContext(wn);return pa(e,"You must render this element inside a <DataRouterContext.Provider> element"),e}function um(){let e=v.useContext(Bl);return pa(e,"You must render this element inside a <DataRouterStateContext.Provider> element"),e}var ha=v.createContext(void 0);ha.displayName="FrameworkContext";function ud(){let e=v.useContext(ha);return pa(e,"You must render this element inside a <HydratedRouter> element"),e}function cm(e,t){let n=v.useContext(ha),[r,l]=v.useState(!1),[o,i]=v.useState(!1),{onFocus:a,onBlur:s,onMouseEnter:c,onMouseLeave:m,onTouchStart:h}=t,g=v.useRef(null);v.useEffect(()=>{if(e==="render"&&i(!0),e==="viewport"){let k=f=>{f.forEach(d=>{i(d.isIntersecting)})},C=new IntersectionObserver(k,{threshold:.5});return g.current&&C.observe(g.current),()=>{C.disconnect()}}},[e]),v.useEffect(()=>{if(r){let k=setTimeout(()=>{i(!0)},100);return()=>{clearTimeout(k)}}},[r]);let y=()=>{l(!0)},x=()=>{l(!1),i(!1)};return n?e!=="intent"?[o,g,{}]:[o,g,{onFocus:Ln(a,y),onBlur:Ln(s,x),onMouseEnter:Ln(c,y),onMouseLeave:Ln(m,x),onTouchStart:Ln(h,y)}]:[!1,g,{}]}function Ln(e,t){return n=>{e&&e(n),n.defaultPrevented||t(n)}}function dm({page:e,...t}){let{router:n}=sd(),r=v.useMemo(()=>Yc(n.routes,e,n.basename),[n.routes,e,n.basename]);return r?v.createElement(pm,{page:e,matches:r,...t}):null}function fm(e){let{manifest:t,routeModules:n}=ud(),[r,l]=v.useState([]);return v.useEffect(()=>{let o=!1;return lm(e,t,n).then(i=>{o||l(i)}),()=>{o=!0}},[e,t,n]),r}function pm({page:e,matches:t,...n}){let r=Ht(),{manifest:l,routeModules:o}=ud(),{basename:i}=sd(),{loaderData:a,matches:s}=um(),c=v.useMemo(()=>_s(e,t,s,l,r,"data"),[e,t,s,l,r]),m=v.useMemo(()=>_s(e,t,s,l,r,"assets"),[e,t,s,l,r]),h=v.useMemo(()=>{if(e===r.pathname+r.search+r.hash)return[];let x=new Set,k=!1;if(t.forEach(f=>{var p;let d=l.routes[f.route.id];!d||!d.hasLoader||(!c.some(w=>w.route.id===f.route.id)&&f.route.id in a&&((p=o[f.route.id])!=null&&p.shouldRevalidate)||d.hasClientLoader?k=!0:x.add(f.route.id))}),x.size===0)return[];let C=tm(e,i,"data");return k&&x.size>0&&C.searchParams.set("_routes",t.filter(f=>x.has(f.route.id)).map(f=>f.route.id).join(",")),[C.pathname+C.search]},[i,a,r,l,c,t,e,o]),g=v.useMemo(()=>om(m,l),[m,l]),y=fm(m);return v.createElement(v.Fragment,null,h.map(x=>v.createElement("link",{key:x,rel:"prefetch",as:"fetch",href:x,...n})),g.map(x=>v.createElement("link",{key:x,rel:"modulepreload",href:x,...n})),y.map(({key:x,link:k})=>v.createElement("link",{key:x,nonce:n.nonce,...k})))}function hm(...e){return t=>{e.forEach(n=>{typeof n=="function"?n(t):n!=null&&(n.current=t)})}}var mm=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u";try{mm&&(window.__reactRouterVersion="7.11.0")}catch{}function gm({basename:e,children:t,unstable_useTransitions:n,window:r}){let l=v.useRef();l.current==null&&(l.current=Yp({window:r,v5Compat:!0}));let o=l.current,[i,a]=v.useState({action:o.action,location:o.location}),s=v.useCallback(c=>{n===!1?a(c):v.startTransition(()=>a(c))},[n]);return v.useLayoutEffect(()=>o.listen(s),[o,s]),v.createElement(Qh,{basename:e,children:t,location:i.location,navigationType:i.action,navigator:o,unstable_useTransitions:n})}var cd=/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,de=v.forwardRef(function({onClick:t,discover:n="render",prefetch:r="none",relative:l,reloadDocument:o,replace:i,state:a,target:s,to:c,preventScrollReset:m,viewTransition:h,unstable_defaultShouldRevalidate:g,...y},x){let{basename:k,unstable_useTransitions:C}=v.useContext(_e),f=typeof c=="string"&&cd.test(c),d=qc(c,k);c=d.to;let p=Nh(c,{relative:l}),[w,E,j]=cm(r,y),P=wm(c,{replace:i,state:a,target:s,preventScrollReset:m,relative:l,viewTransition:h,unstable_defaultShouldRevalidate:g,unstable_useTransitions:C});function z(_){t&&t(_),_.defaultPrevented||P(_)}let D=v.createElement("a",{...y,...j,href:d.absoluteURL||p,onClick:d.isExternal||o?t:z,ref:hm(x,E),target:s,"data-discover":!f&&n==="render"?"true":void 0});return w&&!f?v.createElement(v.Fragment,null,D,v.createElement(dm,{page:p})):D});de.displayName="Link";var vm=v.forwardRef(function({"aria-current":t="page",caseSensitive:n=!1,className:r="",end:l=!1,style:o,to:i,viewTransition:a,children:s,...c},m){let h=gr(i,{relative:c.relative}),g=Ht(),y=v.useContext(Bl),{navigator:x,basename:k}=v.useContext(_e),C=y!=null&&jm(h)&&a===!0,f=x.encodeLocation?x.encodeLocation(h).pathname:h.pathname,d=g.pathname,p=y&&y.navigation&&y.navigation.location?y.navigation.location.pathname:null;n||(d=d.toLowerCase(),p=p?p.toLowerCase():null,f=f.toLowerCase()),p&&k&&(p=rt(p,k)||p);const w=f!=="/"&&f.endsWith("/")?f.length-1:f.length;let E=d===f||!l&&d.startsWith(f)&&d.charAt(w)==="/",j=p!=null&&(p===f||!l&&p.startsWith(f)&&p.charAt(f.length)==="/"),P={isActive:E,isPending:j,isTransitioning:C},z=E?t:void 0,D;typeof r=="function"?D=r(P):D=[r,E?"active":null,j?"pending":null,C?"transitioning":null].filter(Boolean).join(" ");let _=typeof o=="function"?o(P):o;return v.createElement(de,{...c,"aria-current":z,className:D,ref:m,style:_,to:i,viewTransition:a},typeof s=="function"?s(P):s)});vm.displayName="NavLink";var ym=v.forwardRef(({discover:e="render",fetcherKey:t,navigate:n,reloadDocument:r,replace:l,state:o,method:i=Xr,action:a,onSubmit:s,relative:c,preventScrollReset:m,viewTransition:h,unstable_defaultShouldRevalidate:g,...y},x)=>{let{unstable_useTransitions:k}=v.useContext(_e),C=Em(),f=Cm(a,{relative:c}),d=i.toLowerCase()==="get"?"get":"post",p=typeof a=="string"&&cd.test(a),w=E=>{if(s&&s(E),E.defaultPrevented)return;E.preventDefault();let j=E.nativeEvent.submitter,P=(j==null?void 0:j.getAttribute("formmethod"))||i,z=()=>C(j||E.currentTarget,{fetcherKey:t,method:P,navigate:n,replace:l,state:o,relative:c,preventScrollReset:m,viewTransition:h,unstable_defaultShouldRevalidate:g});k&&n!==!1?v.startTransition(()=>z()):z()};return v.createElement("form",{ref:x,method:d,action:f,onSubmit:r?s:w,...y,"data-discover":!p&&e==="render"?"true":void 0})});ym.displayName="Form";function xm(e){return`${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`}function dd(e){let t=v.useContext(wn);return W(t,xm(e)),t}function wm(e,{target:t,replace:n,state:r,preventScrollReset:l,relative:o,viewTransition:i,unstable_defaultShouldRevalidate:a,unstable_useTransitions:s}={}){let c=Ph(),m=Ht(),h=gr(e,{relative:o});return v.useCallback(g=>{if(Jh(g,t)){g.preventDefault();let y=n!==void 0?n:sr(m)===sr(h),x=()=>c(e,{replace:y,state:r,preventScrollReset:l,relative:o,viewTransition:i,unstable_defaultShouldRevalidate:a});s?v.startTransition(()=>x()):x()}},[m,c,h,n,r,t,e,l,o,i,a,s])}var km=0,Sm=()=>`__${String(++km)}__`;function Em(){let{router:e}=dd("useSubmit"),{basename:t}=v.useContext(_e),n=Bh(),r=e.fetch,l=e.navigate;return v.useCallback(async(o,i={})=>{let{action:a,method:s,encType:c,formData:m,body:h}=em(o,t);if(i.navigate===!1){let g=i.fetcherKey||Sm();await r(g,n,i.action||a,{unstable_defaultShouldRevalidate:i.unstable_defaultShouldRevalidate,preventScrollReset:i.preventScrollReset,formData:m,body:h,formMethod:i.method||s,formEncType:i.encType||c,flushSync:i.flushSync})}else await l(i.action||a,{unstable_defaultShouldRevalidate:i.unstable_defaultShouldRevalidate,preventScrollReset:i.preventScrollReset,formData:m,body:h,formMethod:i.method||s,formEncType:i.encType||c,replace:i.replace,state:i.state,fromRouteId:n,flushSync:i.flushSync,viewTransition:i.viewTransition})},[r,l,t,n])}function Cm(e,{relative:t}={}){let{basename:n}=v.useContext(_e),r=v.useContext(Qe);W(r,"useFormAction must be used inside a RouteContext");let[l]=r.matches.slice(-1),o={...gr(e||".",{relative:t})},i=Ht();if(e==null){o.search=i.search;let a=new URLSearchParams(o.search),s=a.getAll("index");if(s.some(m=>m==="")){a.delete("index"),s.filter(h=>h).forEach(h=>a.append("index",h));let m=a.toString();o.search=m?`?${m}`:""}}return(!e||e===".")&&l.route.index&&(o.search=o.search?o.search.replace(/^\?/,"?index&"):"?index"),n!=="/"&&(o.pathname=o.pathname==="/"?n:Ze([n,o.pathname])),sr(o)}function jm(e,{relative:t}={}){let n=v.useContext(td);W(n!=null,"`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");let{basename:r}=dd("useViewTransitionState"),l=gr(e,{relative:t});if(!n.isTransitioning)return!1;let o=rt(n.currentLocation.pathname,r)||n.currentLocation.pathname,i=rt(n.nextLocation.pathname,r)||n.nextLocation.pathname;return kl(l.pathname,i)!=null||kl(l.pathname,o)!=null}var fd={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},Ls=ft.createContext&&ft.createContext(fd),Nm=["attr","size","title"];function Pm(e,t){if(e==null)return{};var n=Rm(e,t),r,l;if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(l=0;l<o.length;l++)r=o[l],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}function Rm(e,t){if(e==null)return{};var n={};for(var r in e)if(Object.prototype.hasOwnProperty.call(e,r)){if(t.indexOf(r)>=0)continue;n[r]=e[r]}return n}function Sl(){return Sl=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},Sl.apply(this,arguments)}function Ts(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(l){return Object.getOwnPropertyDescriptor(e,l).enumerable})),n.push.apply(n,r)}return n}function El(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?Ts(Object(n),!0).forEach(function(r){zm(e,r,n[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Ts(Object(n)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))})}return e}function zm(e,t,n){return t=_m(t),t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function _m(e){var t=Lm(e,"string");return typeof t=="symbol"?t:t+""}function Lm(e,t){if(typeof e!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t);if(typeof r!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function pd(e){return e&&e.map((t,n)=>ft.createElement(t.tag,El({key:n},t.attr),pd(t.child)))}function ve(e){return t=>ft.createElement(Tm,Sl({attr:El({},e.attr)},t),pd(e.child))}function Tm(e){var t=n=>{var{attr:r,size:l,title:o}=e,i=Pm(e,Nm),a=l||n.size||"1em",s;return n.className&&(s=n.className),e.className&&(s=(s?s+" ":"")+e.className),ft.createElement("svg",Sl({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},n.attr,r,i,{className:s,style:El(El({color:e.color||n.color},n.style),e.style),height:a,width:a,xmlns:"http://www.w3.org/2000/svg"}),o&&ft.createElement("title",null,o),e.children)};return Ls!==void 0?ft.createElement(Ls.Consumer,null,n=>t(n)):t(fd)}function Fm(e){return ve({attr:{viewBox:"0 0 320 512"},child:[{tag:"path",attr:{d:"M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"},child:[]}]})(e)}function Om(e){return ve({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"},child:[]}]})(e)}function Mm(e){return ve({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"},child:[]}]})(e)}function Dm(e){return ve({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"},child:[]}]})(e)}function Im(e){return ve({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"},child:[]}]})(e)}function Am(e){return ve({attr:{viewBox:"0 0 576 512"},child:[{tag:"path",attr:{d:"M542.22 32.05c-54.8 3.11-163.72 14.43-230.96 55.59-4.64 2.84-7.27 7.89-7.27 13.17v363.87c0 11.55 12.63 18.85 23.28 13.49 69.18-34.82 169.23-44.32 218.7-46.92 16.89-.89 30.02-14.43 30.02-30.66V62.75c.01-17.71-15.35-31.74-33.77-30.7zM264.73 87.64C197.5 46.48 88.58 35.17 33.78 32.05 15.36 31.01 0 45.04 0 62.75V400.6c0 16.24 13.13 29.78 30.02 30.66 49.49 2.6 149.59 12.11 218.77 46.95 10.62 5.35 23.21-1.94 23.21-13.46V100.63c0-5.29-2.62-10.14-7.27-12.99z"},child:[]}]})(e)}function Um(e){return ve({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"},child:[]}]})(e)}function Bm(e){return ve({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"},child:[]}]})(e)}function $m(e){return ve({attr:{viewBox:"0 0 384 512"},child:[{tag:"path",attr:{d:"M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"},child:[]}]})(e)}function Hm(e){return ve({attr:{viewBox:"0 0 512 512"},child:[{tag:"path",attr:{d:"M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"},child:[]}]})(e)}function Wm(e){return ve({attr:{viewBox:"0 0 496 512"},child:[{tag:"path",attr:{d:"M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm80 168c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm-160 0c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm194.8 170.2C334.3 380.4 292.5 400 248 400s-86.3-19.6-114.8-53.8c-13.6-16.3 11-36.7 24.6-20.5 22.4 26.9 55.2 42.2 90.2 42.2s67.8-15.4 90.2-42.2c13.4-16.2 38.1 4.2 24.6 20.5z"},child:[]}]})(e)}function Vm(e){return ve({attr:{viewBox:"0 0 352 512"},child:[{tag:"path",attr:{d:"M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"},child:[]}]})(e)}function Qm(e){return ve({attr:{viewBox:"0 0 448 512"},child:[{tag:"path",attr:{d:"M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zM104 424c0 13.3 10.7 24 24 24s24-10.7 24-24-10.7-24-24-24-24 10.7-24 24zm216-135.4v49c36.5 7.4 64 39.8 64 78.4v41.7c0 7.6-5.4 14.2-12.9 15.7l-32.2 6.4c-4.3.9-8.5-1.9-9.4-6.3l-3.1-15.7c-.9-4.3 1.9-8.6 6.3-9.4l19.3-3.9V416c0-62.8-96-65.1-96 1.9v26.7l19.3 3.9c4.3.9 7.1 5.1 6.3 9.4l-3.1 15.7c-.9 4.3-5.1 7.1-9.4 6.3l-31.2-4.2c-7.9-1.1-13.8-7.8-13.8-15.9V416c0-38.6 27.5-70.9 64-78.4v-45.2c-2.2.7-4.4 1.1-6.6 1.9-18 6.3-37.3 9.8-57.4 9.8s-39.4-3.5-57.4-9.8c-7.4-2.6-14.9-4.2-22.6-5.2v81.6c23.1 6.9 40 28.1 40 53.4 0 30.9-25.1 56-56 56s-56-25.1-56-56c0-25.3 16.9-46.5 40-53.4v-80.4C48.5 301 0 355.8 0 422.4v44.8C0 491.9 20.1 512 44.8 512h358.4c24.7 0 44.8-20.1 44.8-44.8v-44.8c0-72-56.8-130.3-128-133.8z"},child:[]}]})(e)}function Ym(e){return ve({attr:{viewBox:"0 0 640 512"},child:[{tag:"path",attr:{d:"M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"},child:[]}]})(e)}const hd="/assets/logo-DtY_jg7w.png",Km=()=>{const[e,t]=v.useState(!1),n=v.useRef(null),r=v.useRef(null),l=()=>t(!e);return v.useEffect(()=>{const o=i=>{e&&n.current&&!n.current.contains(i.target)&&r.current&&!r.current.contains(i.target)&&t(!1)};return document.addEventListener("mousedown",o),()=>{document.removeEventListener("mousedown",o)}},[e]),u.jsxs("nav",{className:"navbar",children:[u.jsxs("div",{className:"container nav-container",children:[u.jsx(de,{to:"/",className:"logo-link",children:u.jsx("img",{src:hd,alt:"Empylo Logo",className:"logo-img"})}),u.jsx("div",{className:"mobile-toggle",onClick:l,ref:r,children:e?u.jsx(Vm,{}):u.jsx(Im,{})}),u.jsxs("ul",{className:`nav-links ${e?"active":""}`,ref:n,children:[u.jsx("li",{children:u.jsx(de,{to:"/",onClick:()=>t(!1),children:"Home"})}),u.jsx("li",{children:u.jsx(de,{to:"/about",onClick:()=>t(!1),children:"About"})}),u.jsx("li",{children:u.jsx(de,{to:"/features",onClick:()=>t(!1),children:"Features"})}),u.jsx("li",{children:u.jsx(de,{to:"/contact",onClick:()=>t(!1),children:"Contact Support"})}),u.jsx("li",{className:"mobile-btn",children:u.jsx("button",{className:"btn btn-primary",children:"Download App"})})]}),u.jsx("button",{className:"btn btn-primary desktop-btn",children:"Download App"})]}),u.jsx("style",{children:`
        .navbar {
          height: 80px; /* Reduced height */
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          transition: all 0.3s ease;
          
          /* Glass Effect - White */
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        
        .nav-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .logo-img {
          height: 40px; /* Adjusted size relative to new height */
          width: auto;
          display: block;
          /* Filter to match Primary Turquoise #00a99d */
          filter: invert(48%) sepia(89%) saturate(2476%) hue-rotate(130deg) brightness(92%) contrast(101%);
        }

        .nav-links {
          display: flex;
          gap: 50px;
        }

        .nav-links a {
          font-family: var(--font-body);
          font-weight: 600;
          color: var(--color-secondary);
          font-size: 1rem;
          transition: color 0.2s;
          opacity: 0.8;
        }

        .nav-links a:hover {
          color: var(--color-primary);
          opacity: 1;
        }

        .mobile-toggle {
            display: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--color-primary);
        }
        
        .mobile-btn {
            display: none;
        }
        
        .desktop-btn {
            display: inline-flex;
        }

        @media (max-width: 1024px) {
           .logo-img {
               height: 32px; /* Reduced for Tablet */
           }
        }

        @media (max-width: 960px) {
          .mobile-toggle {
              display: block;
              z-index: 1001;
          }
          
          .desktop-btn {
              display: none;
          }
          
          .mobile-btn {
              display: block;
              margin-top: 10px;
              width: 100%;
          }
          
          .mobile-btn button {
              width: 100%;
          }

          .nav-links {
            /* Compact Card Dropdown for Mobile */
            position: absolute;
            top: 70px; /* Below navbar */
            right: 20px;
            width: 250px; /* Fixed small width */
            height: auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.05);
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 16px;
            padding: 24px;
            
            /* Hidden State */
            transform: translateY(-10px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease-in-out;
            z-index: 999;
          }
          
          .nav-links.active {
              transform: translateY(0);
              opacity: 1;
              pointer-events: auto;
          }
          
          .nav-links li {
              width: 100%;
          }
          
          .nav-links a {
              font-size: 1.05rem; /* Normal size */
              color: var(--color-secondary);
              display: block;
              padding: 4px 0;
          }
          
          .nav-links a:hover {
              color: var(--color-primary);
          }
        }
        
        @media (max-width: 768px) {
            .logo-img {
                height: 28px; /* Further reduced for Mobile */
            }
            .navbar {
                height: 64px; /* Slightly tighter navbar height on mobile */
            }
        }
      `})]})},Gm=()=>u.jsxs("footer",{className:"footer",children:[u.jsxs("div",{className:"container footer-content",children:[u.jsx("div",{className:"footer-brand",children:u.jsx("div",{className:"footer-logo-text",children:u.jsx("img",{src:hd,alt:"Empylo",className:"footer-logo-img"})})}),u.jsxs("div",{className:"footer-links-group",children:[u.jsx("h4",{children:"Company"}),u.jsxs("ul",{children:[u.jsx("li",{children:u.jsx(de,{to:"/",style:{color:"inherit",textDecoration:"none"},children:"Home"})}),u.jsx("li",{children:u.jsx(de,{to:"/about",style:{color:"inherit",textDecoration:"none"},children:"About Us"})}),u.jsx("li",{children:u.jsx(de,{to:"/features",style:{color:"inherit",textDecoration:"none"},children:"Services"})}),u.jsx("li",{children:u.jsx(de,{to:"/contact",style:{color:"inherit",textDecoration:"none"},children:"Contact Us"})})]})]}),u.jsxs("div",{className:"footer-links-group",children:[u.jsx("h4",{children:"Products"}),u.jsxs("ul",{children:[u.jsx("li",{children:"Circles Health App"}),u.jsx("li",{children:"Circles Health App Client"}),u.jsx("li",{children:"How to Use"}),u.jsx("li",{children:"Pricing"}),u.jsx("li",{children:"FAQs"})]})]}),u.jsxs("div",{className:"footer-socials",children:[u.jsx("h4",{children:"Follow Us"}),u.jsxs("div",{className:"social-icons",children:[u.jsx("span",{className:"social-icon",children:u.jsx(Mm,{})}),u.jsx("span",{className:"social-icon",children:u.jsx(Om,{})}),u.jsx("span",{className:"social-icon",children:u.jsx(Dm,{})}),u.jsx("span",{className:"social-icon",children:u.jsx(Fm,{})})]})]})]}),u.jsxs("div",{className:"footer-bottom container",children:[u.jsxs("div",{className:"legal-links",children:[u.jsx("span",{children:u.jsx(de,{to:"/privacy-policy",style:{color:"inherit",textDecoration:"none"},children:"Privacy Policy"})}),u.jsx("span",{children:u.jsx(de,{to:"/terms",style:{color:"inherit",textDecoration:"none"},children:"Terms of Use"})}),u.jsx("span",{children:u.jsx(de,{to:"/delete-account",style:{color:"inherit",textDecoration:"none"},children:"Delete Account"})})]}),u.jsx("p",{className:"copyright-text",children:"© Copyright Empylo 2026. All rights reserved"})]}),u.jsx("style",{children:`
          .footer {
            background-color: var(--color-primary);
            color: #fff;
            padding: 80px 0 40px;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
          
          .footer-logo-text {
             font-size: 1.5rem;
             font-weight: 700;
             margin-bottom: 20px;
             display: flex;
             align-items: center;
             justify-content: center;
             gap: 10px;
          }
          
          .footer-logo-img {
              height: 36px;
              width: auto;
              filter: brightness(0) invert(1); /* Make logo white */
          }
          
          .footer-content {
            display: grid;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            gap: 40px;
            margin-bottom: 60px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 40px;
            text-align: center;
          }
          
          .footer h4 {
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 1;
            margin-bottom: 24px;
            font-weight: 800;
            color: #fff; /* White Heading */
          }
          
          .footer ul li {
            margin-bottom: 14px;
            font-size: 1.1rem; /* Slightly larger */
            cursor: pointer;
            opacity: 1;
            transition: all 0.2s;
            font-weight: 700; /* Bold */
            color: rgba(255,255,255,0.9);
          }
          
          .footer ul li:hover {
            transform: translateX(4px);
            color: #fff;
          }
          
          /* Socials styling unchanged */
          
          .social-icons {
              display: flex;
              gap: 16px;
              justify-content: center;
          }
          
          .social-icon {
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(255,255,255,0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2rem;
              cursor: pointer;
              transition: all 0.3s;
              color: white;
          }
          
          .social-icon:hover {
              transform: translateY(-4px);
              background: white;
              color: var(--color-primary);
          }
  
          .footer-bottom {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 20px;
              font-size: 1rem;
              opacity: 1;
              font-weight: 600; /* Bold */
              margin-top: 20px;
              color: rgba(255,255,255,0.8);
          }
          
          .legal-links {
              display: flex;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap; /* Allow wrapping on small screens */
              gap: 20px;
          }
          
          .legal-links span {
              cursor: pointer;
              position: relative;
          }

          /* Default Pipes for Desktop/Tablet */
          .legal-links span:not(:last-child)::after {
              content: '|';
              position: absolute;
              right: -14px;
              color: rgba(255,255,255,0.4);
              pointer-events: none;
          }
          
          .copyright-text {
              opacity: 0.7;
              font-weight: 500;
              text-align: center;
          }

          /* Tablet adjustments */
          @media (max-width: 1024px) {
            .footer-content {
               /* Slightly condensed grid for tablet, but keep structure */
               grid-template-columns: 1.5fr 1fr 1fr 1fr; 
               text-align: left;
               gap: 20px;
            }
            .footer-brand {
                grid-column: 1; /* Brand in first column */
                margin-bottom: 0;
            }
            .footer-links-group {
                text-align: left;
                display: block;
                align-items: flex-start;
            }
            .footer-socials {
                grid-column: 4; /* Socials in last column */
                margin-top: 0;
            }
             .footer-logo-text {
                 justify-content: flex-start;
             }
             .social-icons {
                 justify-content: flex-start;
             }
          }
          
          /* Intermediate breakpoint for smaller tablets */
          @media (max-width: 768px) {
             .footer-content {
                grid-template-columns: 1fr 1fr; /* 2x2 grid */
                text-align: left;
                gap: 40px;
             }
             .footer-brand { grid-column: 1 / -1; }
             .footer-socials { grid-column: 1 / -1; }
             .footer-logo-text { justify-content: flex-start; } 
          }


          @media (max-width: 600px) {
            .footer-content {
              grid-template-columns: 1fr;
              text-align: center;
              gap: 32px; /* Slightly tighter gap */
            }
            .footer-brand, .footer-socials {
                grid-column: auto;
            }
             .footer-logo-text { justify-content: center; } 
             .social-icons { justify-content: center; }
             
            .footer-links-group {
                text-align: center;
                align-items: center;
            }
            
            /* Mobile Font Size Reductions */
            .footer h4 {
                font-size: 1rem; /* Smaller headings */
                margin-bottom: 16px;
            }
            .footer ul li {
                font-size: 0.95rem; /* Smaller links */
                margin-bottom: 12px;
            }
            .footer-brand p {
                font-size: 0.9rem;
            }
            
            /* Clean Mobile Stack for Legal Links */
            .legal-links {
                flex-direction: column;
                gap: 10px;
            }
            .legal-links span {
                display: block;
                margin: 0;
            }
            /* Hide pipes on mobile stack */
            .legal-links span:not(:last-child)::after {
                display: none; 
            }
            
            .footer-bottom {
                gap: 20px;
                font-size: 0.85rem; /* Smaller legal text */
                margin-top: 10px;
            }
          }
        `})]}),Xm=()=>u.jsxs("div",{className:"layout",children:[u.jsx(Km,{}),u.jsx("main",{className:"main-content",children:u.jsx(Vh,{})}),u.jsx(Gm,{}),u.jsx("style",{children:`
        .layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex: 1;
        }
      `})]}),md="/assets/iphone-mockup-2-DIM5un3K.png",bm="/assets/vector-logo-c5qGGyK3.png",Jm=()=>u.jsxs("section",{className:"hero",children:[u.jsx("div",{className:"blob blob-1"}),u.jsx("div",{className:"blob blob-2"}),u.jsxs("div",{className:"container hero-container",children:[u.jsxs("div",{className:"hero-content",children:[u.jsx("p",{className:"hero-subtitle",children:"YOUR PERSONAL WELLNESS COMPANION"}),u.jsxs("h1",{className:"hero-title",children:["Find Your ",u.jsx("span",{className:"highlight",children:"Circle"}),",",u.jsx("br",{}),"Find Your Peace"]}),u.jsx("p",{className:"hero-description",children:"Sign up to champion a workplace that values mental health. Together, let's create a nurturing environment where your employees can thrive."}),u.jsx("button",{className:"btn btn-primary btn-lg",children:"Get Started"})]}),u.jsxs("div",{className:"hero-image",children:[u.jsx("img",{src:bm,alt:"",className:"hero-vector-bg"}),u.jsx("div",{className:"img-container-skew",children:u.jsx("img",{src:md,alt:"Dashboard Mockup",className:"hero-mockup-img"})})]})]}),u.jsx("style",{children:`
        .hero {
          padding: 120px 0 160px;
          position: relative;
          overflow: hidden; /* For blobs */
        }

        /* Abstract Blobs for depth */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          z-index: -1;
        }
        .blob-1 {
          width: 600px;
          height: 600px;
          background: #CCFBF1; /* Teal light */
          top: -200px;
          right: -100px;
        }
        .blob-2 {
          width: 500px;
          height: 500px;
          background: #FEE2E2; /* Soft red/pinkish hint */
          bottom: -100px;
          left: -100px;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          align-items: center;
          position: relative;
        }

        .hero-subtitle {
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 24px;
          font-size: 0.875rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero-title {
          font-size: 5rem; /* Massive Premium Heading */
          line-height: 1.05;
          font-weight: 800;
          margin-bottom: 32px;
          color: #111827;
          letter-spacing: -2px;
        }

        .hero-title .highlight {
          color: var(--color-accent);
          position: relative;
        }
        
        /* Underline effect for highlight */
        .hero-title .highlight::after {
            content: '';
            position: absolute;
            bottom: 8px;
            left: 0;
            width: 100%;
            height: 12px;
            background: rgba(245, 158, 11, 0.2);
            z-index: -1;
            transform: rotate(-2deg);
        }

        .hero-description {
          font-size: 1.25rem;
          color: #4B5563;
          margin-bottom: 48px;
          max-width: 540px;
          line-height: 1.6;
        }

        .btn-lg {
            padding: 1.125rem 3rem;
            font-size: 1.125rem;
            box-shadow: 0 10px 30px rgba(15, 118, 110, 0.25);
        }

        .hero-image {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .hero-vector-bg {
           position: absolute;
           z-index: -1;
           width: 140%; 
           max-width: none;
           top: 50%;
           left: 50%;
           transform: translate(-50%, -50%) scale(1.1);
           opacity: 1;
           pointer-events: none;
        }

        .img-container-skew {
          width: 100%;
          transform: perspective(2500px) rotateY(-12deg) rotateX(5deg) scale(1.25);
          transform-origin: center center;
          /* Removed background, border, and box-shadow per user request */
          /* The image itself is the mockup, floating over the vector */
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .img-container-skew:hover {
           transform: perspective(2500px) rotateY(-5deg) rotateX(2deg) scale(1.3);
           /* Removed hover shadow on container */
        }
        
        .hero-mockup-img {
            width: 100%;
            height: auto;
            display: block;
            /* Removed border-radius and box-shadow to prevent rectangular artifacts 
               on transparent/curled mockup images. */
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15)); /* Optional: softer shadow respecting transparency */
        }
        
        /* Remove unused mock-ui styles */

        /* Tablet adjustments */
        @media (max-width: 1024px) {
          .hero-title { font-size: 3.5rem; }
          .hero-container {
            /* Keep side-by-side for tablet, just tighter */
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: left; /* Reset text align */
          }
           .hero-subtitle { margin: 0 0 16px; }
           .hero-description { margin: 0 0 32px; }
           .img-container-skew { 
               transform: perspective(2500px) rotateY(-8deg) rotateX(4deg) scale(1.1); /* Tamed skew */
           }
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hero { 
              padding: 40px 0 60px;
              background: #F0FDFA; /* Slight tint instead of white to separate from header */
          }
          .hero-container {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 20px;
          }
          /* HIDE background elements that might obstruct */
          .hero-vector-bg, .blob {
              display: none !important;
          }
          
          .hero-subtitle { 
              margin: 0 auto 12px; 
              font-size: 0.75rem;
          }
          .hero-title { 
              font-size: 2rem;
              letter-spacing: -1px;
              margin-bottom: 16px;
              line-height: 1.15;
          }
          .hero-description { 
              margin: 0 auto 24px; 
              font-size: 0.95rem;
              padding: 0 10px;
              max-width: 100%;
          }
          .btn-lg {
              padding: 0.875rem 2rem;
              font-size: 1rem;
              width: auto;
              min-width: 200px;
          }
          
          .img-container-skew { 
              transform: none; 
              margin-top: 10px;
              width: 100%;
          }
          .hero-mockup-img {
              max-width: 100%;
              width: 100%;
              height: auto;
              filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1));
          }
        }
      `})]}),Zm="/assets/app-screen-1--Bda22Nw.png",Fs=()=>{const e=[{title:"Supportive Communities",description:"Join Circles that resonate with your journey. Share, listen, and grow together.",icon:u.jsx(Ym,{}),color:"#F5A623"},{title:"Daily Mood Tracking",description:"Check in with yourself daily. Visualize your emotional trends and gain self-awareness.",icon:u.jsx(Wm,{}),color:"#F5A623"},{title:"Private & Secure",description:"Your data and conversations are encrypted. A safe space to be vulnerable.",icon:u.jsx(Hm,{}),color:"#F5A623"},{title:"Wellness Resources",description:"Access a library of curated articles, affirmations, and exercises.",icon:u.jsx(Am,{}),color:"#F5A623"},{title:"Professional Support",description:"Connect with certified therapists and counselors when you need extra help.",icon:u.jsx(Qm,{}),color:"#F5A623"},{title:"Holistic Health",description:"Tools designed to improve your mental, emotional, and social well-being.",icon:u.jsx(Bm,{}),color:"#F5A623"}];return u.jsxs("section",{className:"features-section",children:[u.jsxs("div",{className:"container",children:[u.jsxs("div",{className:"features-header",children:[u.jsx("h2",{children:"Holistic Wellness in Your Pocket"}),u.jsx("p",{className:"features-subheader",children:"Everything you need to nurture your mental health, all in one premium app."})]}),u.jsxs("div",{className:"features-grid",children:[u.jsx("div",{className:"features-column",children:e.slice(0,3).map((t,n)=>u.jsxs("div",{className:"feature-card",children:[u.jsx("div",{className:"feature-icon-wrapper",style:{color:t.color},children:t.icon}),u.jsxs("div",{className:"feature-text",children:[u.jsx("h3",{children:t.title}),u.jsx("p",{children:t.description})]})]},n))}),u.jsx("div",{className:"features-center-img",children:u.jsxs("div",{className:"app-mockup-container",children:[u.jsx("img",{src:Zm,alt:"Circles App",className:"app-screen-img"}),u.jsx("div",{className:"app-glow"})]})}),u.jsx("div",{className:"features-column",children:e.slice(3,6).map((t,n)=>u.jsxs("div",{className:"feature-card",children:[u.jsx("div",{className:"feature-icon-wrapper",style:{color:t.color},children:t.icon}),u.jsxs("div",{className:"feature-text",children:[u.jsx("h3",{children:t.title}),u.jsx("p",{children:t.description})]})]},n))})]})]}),u.jsx("style",{children:`
        .features-section {
          padding: 120px 0;
          background-color: #F8FAFC;
          position: relative;
        }

        .features-header {
          text-align: center;
          margin-bottom: 80px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .features-header h2 {
          font-size: 3rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .features-subheader {
          font-size: 1.25rem;
          color: #64748B;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr 0.8fr 1fr;
          gap: 40px;
          align-items: center;
        }
        
        .features-column {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .feature-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          display: flex;
          gap: 20px;
          align-items: flex-start;
          transition: all 0.3s ease;
          border: 1px solid rgba(0,0,0,0.03);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.01);
          min-height: 140px; /* Ensure uniform height perception */
        }
        
        .feature-card:hover {
           transform: translateY(-5px);
           box-shadow: 0 20px 40px rgba(0,0,0,0.06);
           border-color: rgba(15, 118, 110, 0.1);
        }

        .feature-icon-wrapper {
          font-size: 1.5rem;
          background: #FEF3C7;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          flex-shrink: 0;
        }

        .feature-text h3 {
          font-size: 1.15rem;
          margin-bottom: 6px;
          color: #1E293B;
          font-weight: 700;
        }

        .feature-text p {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.5;
        }

        .features-center-img {
           display: flex;
           justify-content: center;
           position: relative;
        }
        
        .app-mockup-container {
           position: relative;
           width: 280px;
           border-radius: 40px;
           z-index: 10;
        }
        
        .app-screen-img {
            width: 100%;
            height: auto;
            border-radius: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 8px solid white;
        }
        
        .app-glow {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 80%;
            background: radial-gradient(circle, rgba(13, 148, 136, 0.2) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
            filter: blur(40px);
        }

        @media (max-width: 1024px) {
          .features-grid {
            grid-template-columns: 1fr 1fr; 
            gap: 30px;
            align-items: start;
          }
           .features-center-img {
             grid-column: 1 / -1; 
             margin: 40px auto 0;
             order: 10;
           }
           .features-column {
               display: contents; 
           }
        }

        @media (max-width: 768px) {
          .features-section { padding: 60px 0; }
          .features-header { padding: 0 20px; margin-bottom: 40px; }
          .features-header h2 { font-size: 2rem; }
          .features-grid { grid-template-columns: 1fr; gap: 16px; }
          .features-center-img { width: 100%; margin-bottom: 32px; order: -1; }
          .feature-card { flex-direction: row; text-align: left; }
        }
      `})]})},gd=()=>{const[e,t]=v.useState("idle"),[n,r]=v.useState(""),l=o=>{o.preventDefault();const i=o.currentTarget,a=new FormData(i);String(a.get("firstName")||""),String(a.get("lastName")||""),String(a.get("email")||""),String(a.get("company")||""),String(a.get("message")||"");{r("Contact service is not configured."),t("error");return}};return u.jsxs("section",{className:"contact-section",children:[u.jsxs("div",{className:"container contact-container",children:[u.jsxs("div",{className:"contact-header",children:[u.jsx("h2",{children:"Get in Touch"}),u.jsx("p",{className:"contact-subheader",children:"Have questions? We'd love to hear from you."})]}),u.jsxs("div",{className:"contact-card glass-panel",children:[u.jsx("div",{className:"contact-icon-top",children:u.jsx("span",{children:"📞"})}),u.jsxs("form",{className:"contact-form",onSubmit:l,children:[u.jsxs("div",{className:"form-row",children:[u.jsxs("div",{className:"form-group",children:[u.jsx("label",{children:"First name*"}),u.jsx("input",{type:"text",name:"firstName",placeholder:"Jane",required:!0})]}),u.jsxs("div",{className:"form-group",children:[u.jsx("label",{children:"Last name*"}),u.jsx("input",{type:"text",name:"lastName",placeholder:"Doe",required:!0})]})]}),u.jsxs("div",{className:"form-group",children:[u.jsx("label",{children:"Email*"}),u.jsx("input",{type:"email",name:"email",placeholder:"jane@company.com",required:!0})]}),u.jsxs("div",{className:"form-group",children:[u.jsx("label",{children:"Company name*"}),u.jsx("input",{type:"text",name:"company",placeholder:"Company Inc.",required:!0})]}),u.jsxs("div",{className:"form-group",children:[u.jsx("label",{children:"Message*"}),u.jsx("textarea",{name:"message",rows:5,placeholder:"Tell us a bit about your team...",required:!0})]}),u.jsx("button",{type:"submit",className:"btn btn-primary btn-block",children:"Send Message"})]}),e==="sent"&&u.jsx("p",{className:"contact-success",children:"Thanks! We received your message."}),e==="error"&&u.jsx("p",{className:"contact-error",children:n||"Something went wrong. Try again."}),u.jsx("p",{className:"contact-disclaimer",children:"By submitting this form, you agree to our privacy policy and terms of service."})]})]}),u.jsx("style",{children:`
          .contact-section {
            padding: 120px 0 160px;
            background: radial-gradient(circle at 50% 100%, #E0F2F1 0%, #FAFAFA 50%);
            position: relative;
            display: flex;
            justify-content: center;
          }
  
          .contact-container {
            width: 100%;
            max-width: 640px; 
            text-align: center;
            position: relative;
            z-index: 2;
          }
          
          .contact-header {
             margin-bottom: 60px;
          }

          .contact-header h2 {
            margin-bottom: 16px;
            font-size: 3rem;
            color: #111;
          }
          
          .contact-subheader {
             font-size: 1.25rem;
             color: #666;
          }
  
          .contact-card {
            padding: 48px;
            border-radius: 24px;
            position: relative;
            margin-top: 40px;
            /* Glass styles provided by global class, enhanced here */
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          }
  
          .contact-icon-top {
            position: absolute;
            top: -48px;
            left: 50%;
            transform: translateX(-50%);
            width: 96px;
            height: 96px;
            background: var(--color-primary-light);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: white;
            border: 8px solid #FAFAFA;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
  
          .contact-form {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin-top: 32px;
          }
  
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
  
          .form-group {
            display: flex;
            flex-direction: column;
            text-align: left;
          }
  
          .form-group label {
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: #374151;
            font-weight: 600;
          }
  
          .form-group input,
          .form-group textarea {
            padding: 16px;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            font-size: 1.05rem;
            font-family: inherit;
            outline: none;
            transition: all 0.2s;
            background: #F9FAFB;
          }
  
          .form-group input:focus,
          .form-group textarea:focus {
            border-color: var(--color-primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.1);
          }
  
          .btn-block {
            width: 100%;
            margin-top: 16px;
            padding: 16px;
            font-size: 1.1rem;
          }
  
          .contact-disclaimer {
            margin-top: 32px;
            font-size: 0.85rem;
            color: #9CA3AF;
            line-height: 1.5;
          }

          .contact-success {
            margin-top: 16px;
            font-size: 0.95rem;
            color: #0F766E;
            font-weight: 600;
          }

          .contact-error {
            margin-top: 16px;
            font-size: 0.95rem;
            color: #B91C1C;
            font-weight: 600;
          }
          
          @media(max-width: 600px) {
              .form-row {
                  grid-template-columns: 1fr;
              }
              .contact-card {
                  padding: 24px;
              }
          }
        `})]})},qm="/assets/iphone-mockup-1-BFy3mLL9.png",eg="/assets/google-play-badge-DEqdKz_R.png",tg="/assets/app-store-badge-C0sREJ0J.png",ng=()=>u.jsxs("section",{className:"download-section",children:[u.jsxs("div",{className:"container download-container",children:[u.jsxs("div",{className:"download-content",children:[u.jsxs("h2",{className:"download-title",children:["Download The ",u.jsx("br",{}),"Circles Health App by Empylo"]}),u.jsx("p",{className:"download-desc",children:"Circles Health App by Empylo provides a unique data-powered approach to combat loneliness and improve mental and physical health. Join now to experience meaningful connections like never before."}),u.jsxs("div",{className:"app-buttons",children:[u.jsx("a",{href:"#",className:"store-link",children:u.jsx("img",{src:eg,alt:"Get it on Google Play",className:"store-img"})}),u.jsx("a",{href:"#",className:"store-link",children:u.jsx("img",{src:tg,alt:"Download on the App Store",className:"store-img"})})]})]}),u.jsxs("div",{className:"download-image",children:[u.jsx("img",{src:md,alt:"App Mockup Desktop",className:"mockup-desktop"}),u.jsx("img",{src:qm,alt:"App Mockup Mobile",className:"mockup-mobile"})]})]}),u.jsx("style",{children:`
        .download-section {
          background: #CCFBF1; /* Light Pastel Teal matching screenshot */
          padding: 100px 0;
          overflow: hidden;
          color: #111827; /* Dark text */
        }

        .download-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 60px;
        }

        .download-title {
          font-size: 3rem;
          margin-bottom: 24px;
          line-height: 1.1;
          color: #111827;
          font-weight: 800;
        }

        .download-desc {
          color: #374151; /* Dark grey */
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 540px;
          font-size: 1.125rem;
        }

        .app-buttons {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .store-link {
          display: inline-block;
          transition: transform 0.2s ease;
          border-radius: 8px; /* Smooth corners for badge */
          overflow: hidden;
        }

        .store-link:hover {
            transform: translateY(-4px);
            opacity: 0.9;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .store-img {
            height: 50px; /* Standard badge height */
            width: auto;
            display: block;
        }

        .download-image {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .mockup-desktop {
            display: block;
            width: 100%;
            max-width: 600px; /* Limit width */
            height: auto;
            transform: scale(1.1); /* Slight pop */
        }

        .mockup-mobile {
            display: none;
        }

        /* Tablet adjustments */
        @media(max-width: 1024px) {
            .download-container {
                grid-template-columns: 1fr 1fr;
                gap: 40px;
            }
            .download-title {
                font-size: 2.5rem;
            }
        }

        /* Mobile adjustments: Switch Image & Stack */
        @media(max-width: 768px) {
            .download-section {
                padding: 60px 0;
            }
            .download-container {
                grid-template-columns: 1fr;
                text-align: center;
                gap: 40px;
            }
            .download-content {
                padding: 0 20px;
            }
            .download-title {
                font-size: 2rem;
                margin: 0 auto 16px;
            }
            .download-desc {
                margin: 0 auto 32px;
                font-size: 1rem;
                padding: 0 10px;
            }
            .app-buttons {
                flex-direction: row; /* Side by side on mobile if they fit, or stack if small */
                justify-content: center;
                flex-wrap: wrap;
                gap: 16px;
            }

            .store-img {
                height: 48px; /* Slightly smaller on mobile if needed */
            }

            /* Toggle Images */
            .mockup-desktop {
                display: none;
            }
            .mockup-mobile {
                display: block;
                width: 100%;
                max-width: 320px; /* Constrain mobile image width */
                height: auto;
                margin: 0 auto;
            }
        }
      `})]}),rg=()=>u.jsxs("div",{className:"legal-page",children:[u.jsxs("div",{className:"container",children:[u.jsx("h1",{children:"Privacy Policy"}),u.jsx("p",{className:"last-updated",children:"Last Updated: January 1, 2026"}),u.jsxs("section",{children:[u.jsx("h2",{children:"1. Introduction"}),u.jsx("p",{children:'Welcome to Circles Health ("Empylo", "we", "our", or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ("Circles App") and website.'})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"2. Information We Collect"}),u.jsx("h3",{children:"2.1 Personal Information"}),u.jsx("p",{children:"We may collect personal information that you voluntarily provide to us when you register for the App, expressed interest in obtaining information about us or our products and services, when you participate in activities on the App (such as posting in forums or entering competitions, contests or giveaways) or otherwise when you contact us."}),u.jsx("h3",{children:"2.2 Health and Mood Data"}),u.jsx("p",{children:"The App allows you to track your mood and wellness. This data is stored securely and is used to provide you with personal insights. We do not sell your health data to third parties."})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"3. How We Use Your Information"}),u.jsx("p",{children:"We use the information we collect or receive:"}),u.jsxs("ul",{children:[u.jsx("li",{children:"To facilitate account creation and logon process."}),u.jsx("li",{children:"To send you administrative information."}),u.jsx("li",{children:"To fulfill and manage your orders."}),u.jsx("li",{children:"To post testimonials."}),u.jsx("li",{children:"To deliver and facilitate delivery of services to the user."}),u.jsx("li",{children:"To respond to user inquiries/offer support to users."})]})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"4. Data Security"}),u.jsx("p",{children:"We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse."})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"5. Contact Us"}),u.jsx("p",{children:"If you have questions or comments about this policy, you may email us at support@empylo.com."})]})]}),u.jsx("style",{children:`
        .legal-page {
          padding: 120px 0;
          background-color: #F8FAFC; 
          min-height: 80vh;
        }
        
        .legal-page h1 {
          font-size: 2.5rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 800;
        }
        
        .last-updated {
          color: #64748B;
          margin-bottom: 48px;
          font-size: 0.9rem;
        }
        
        .legal-page section {
          margin-bottom: 40px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .legal-page h2 {
          font-size: 1.5rem;
          color: #1E293B;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .legal-page h3 {
          font-size: 1.1rem;
          color: #334155;
          margin: 24px 0 12px;
          font-weight: 600;
        }
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        .legal-page ul {
          list-style-type: disc;
          padding-left: 24px;
          margin-bottom: 16px;
        }
        
        .legal-page li {
          color: #475569;
          margin-bottom: 8px;
          line-height: 1.6;
        }
      `})]}),lg=()=>u.jsxs("div",{className:"legal-page",children:[u.jsxs("div",{className:"container",children:[u.jsx("h1",{children:"Terms of Service"}),u.jsx("p",{className:"last-updated",children:"Last Updated: January 1, 2026"}),u.jsxs("section",{children:[u.jsx("h2",{children:"1. Agreement to Terms"}),u.jsx("p",{children:'These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and Empylo ("we," “us” or “our”), concerning your access to and use of the Circles Health mobile application as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).'})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"2. Intellectual Property Rights"}),u.jsx("p",{children:"Unless otherwise indicated, the Site and the App are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws."})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"3. User Representations"}),u.jsx("p",{children:"By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service."})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"4. Community Guidelines"}),u.jsx("p",{children:"Circles Health is a safe space. We do not tolerate harassment, hate speech, or any form of abuse. We reserve the right to suspend or terminate accounts that violate our community standards."})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"5. Contact Us"}),u.jsx("p",{children:"In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at support@empylo.com."})]})]}),u.jsx("style",{children:`
        .legal-page {
          padding: 120px 0;
          background-color: #F8FAFC; 
          min-height: 80vh;
        }
        
        .legal-page h1 {
          font-size: 2.5rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 800;
        }
        
        .last-updated {
          color: #64748B;
          margin-bottom: 48px;
          font-size: 0.9rem;
        }
        
        .legal-page section {
          margin-bottom: 40px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .legal-page h2 {
          font-size: 1.5rem;
          color: #1E293B;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
      `})]}),og=()=>u.jsxs("div",{className:"legal-page",children:[u.jsxs("div",{className:"container",children:[u.jsx("h1",{children:"Request Account Deletion"}),u.jsx("p",{className:"last-updated",children:"We respect your right to be forgotten."}),u.jsxs("section",{children:[u.jsx("h2",{children:"How to Delete Your Account"}),u.jsx("p",{children:"You can delete your account and all associated data directly within the Circles App."}),u.jsxs("ol",{children:[u.jsxs("li",{children:["Open the ",u.jsx("strong",{children:"Circles App"})," on your mobile device."]}),u.jsxs("li",{children:["Go to ",u.jsx("strong",{children:"Settings"})," (accessible from your Profile)."]}),u.jsxs("li",{children:["Select ",u.jsx("strong",{children:"Account Settings"}),"."]}),u.jsxs("li",{children:["Tap on ",u.jsx("strong",{children:"Delete Account"})," at the bottom of the screen."]}),u.jsx("li",{children:"Confirm your choice. This action is irreversible."})]})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"Manual Request"}),u.jsx("p",{children:"If you no longer have access to the app, you may request account deletion by emailing our support team. Please include your registered email address so we can verify your identity."}),u.jsx("a",{href:"mailto:support@empylo.com",className:"btn btn-primary",children:"Email Support to Delete Account"})]}),u.jsxs("section",{children:[u.jsx("h2",{children:"What Happens to Your Data?"}),u.jsx("p",{children:"When you delete your account:"}),u.jsxs("ul",{children:[u.jsx("li",{children:"Your profile and personal information will be permanently removed."}),u.jsx("li",{children:"Your mood logs and private journal entries will be deleted."}),u.jsx("li",{children:"Your community posts may remain but will be anonymized."})]})]})]}),u.jsx("style",{children:`
        .legal-page {
          padding: 120px 0;
          background-color: #F8FAFC; 
          min-height: 80vh;
        }
        
        .legal-page h1 {
          font-size: 2.5rem;
          color: #0F172A;
          margin-bottom: 16px;
          font-weight: 800;
        }
        
        .last-updated {
          color: #64748B;
          margin-bottom: 48px;
          font-size: 1.1rem;
        }
        
        .legal-page section {
          margin-bottom: 40px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .legal-page h2 {
          font-size: 1.5rem;
          color: #1E293B;
          margin-bottom: 16px;
          font-weight: 700;
        }
        
        .legal-page p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        .legal-page ol, .legal-page ul {
          padding-left: 24px;
          margin-bottom: 24px;
          color: #475569;
        }
        
        .legal-page li {
          margin-bottom: 12px;
          line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            margin-top: 16px;
        }
      `})]}),ig=()=>u.jsxs("div",{className:"about-page",children:[u.jsx("section",{className:"about-hero",children:u.jsx("div",{className:"container",children:u.jsxs("div",{className:"hero-content",children:[u.jsxs("h1",{children:["We Are Democratizing ",u.jsx("br",{})," ",u.jsx("span",{className:"highlight",children:"Mental Health Support"})]}),u.jsx("p",{children:"At Empylo, we believe that mental wellness is a fundamental human right. Our mission is to build a world where everyone has a circle of support, accessible anytime, anywhere."})]})})}),u.jsx("section",{className:"story-section container",children:u.jsxs("div",{className:"story-grid",children:[u.jsxs("div",{className:"story-text",children:[u.jsx("h2",{children:"Our Story"}),u.jsx("p",{children:"Empylo was born from a simple observation: while the world is more connected than ever, people feel increasingly isolated in their struggles. Traditional therapy is often expensive or inaccessible, and social media can sometimes exacerbate feelings of inadequacy."}),u.jsx("p",{children:"We set out to create a third space—a digital sanctuary that combines the warmth of human connection with the precision of clinically-backed tools. Circles Health App is the result of years of research, design, and listening to stories of resilience."})]}),u.jsx("div",{className:"story-visual",children:u.jsx("div",{className:"visual-block"})})]})}),u.jsx("section",{className:"values-section",children:u.jsxs("div",{className:"container",children:[u.jsx("h2",{children:"Our Core Values"}),u.jsxs("div",{className:"values-grid",children:[u.jsxs("div",{className:"value-card",children:[u.jsx("h3",{children:"Empathy First"}),u.jsx("p",{children:"We design with the heart. Every feature is built to validate feelings and foster understanding."})]}),u.jsxs("div",{className:"value-card",children:[u.jsx("h3",{children:"Radical Privacy"}),u.jsx("p",{children:"Your data is sacred. We enforce the strictest security standards because trust is our currency."})]}),u.jsxs("div",{className:"value-card",children:[u.jsx("h3",{children:"Community Power"}),u.jsx("p",{children:"Healing happens together. We empower users to lift each other up through shared experiences."})]}),u.jsxs("div",{className:"value-card",children:[u.jsx("h3",{children:"Innovation"}),u.jsx("p",{children:"We leverage technology not to replace human connection, but to enhance and scale it."})]})]})]})}),u.jsx("style",{children:`
        .about-page {
          background-color: #FAFAFA;
        }

        .about-hero {
          padding: 80px 0 100px;
          text-align: center;
          background: white;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .hero-content h1 {
          font-size: 3.5rem;
          color: #0F172A;
          margin-bottom: 24px;
          line-height: 1.2;
          font-weight: 800;
        }

        .hero-content .highlight {
          color: var(--color-primary);
          position: relative;
          display: inline-block;
        }

        .hero-content p {
          font-size: 1.25rem;
          color: #475569;
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .story-section {
          padding: 100px 15px;
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .story-text h2 {
          font-size: 2.5rem;
          margin-bottom: 24px;
          color: #1E293B;
          font-weight: 700;
        }

        .story-text p {
          font-size: 1.1rem;
          color: #475569;
          margin-bottom: 20px;
          line-height: 1.7;
        }

        .visual-block {
          background: var(--color-primary-light);
          height: 400px;
          border-radius: 40px;
          width: 100%;
          opacity: 0.2;
          background-image: radial-gradient(#0F766E 2px, transparent 2px);
          background-size: 30px 30px;
        }

        .values-section {
          background: #0F172A; /* Dark background for impact */
          padding: 100px 0;
          color: white;
        }

        .values-section h2 {
          text-align: center;
          font-size: 2.5rem;
          margin-bottom: 60px;
          font-weight: 700;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
        }

        .value-card {
          background: rgba(255,255,255,0.05);
          padding: 32px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.3s ease;
        }

        .value-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.1);
        }

        .value-card h3 {
          font-size: 1.25rem;
          margin-bottom: 12px;
          color: var(--color-accent);
          font-weight: 700;
        }

        .value-card p {
          color: #94A3B8;
          line-height: 1.6;
        }

        @media (max-width: 768px) {
          .hero-content h1 { font-size: 2.5rem; }
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .visual-block { height: 250px; }
        }
      `})]}),ag=()=>u.jsxs("div",{className:"contact-page",children:[u.jsx(gd,{}),u.jsx("section",{className:"contact-details container",children:u.jsxs("div",{className:"details-grid",children:[u.jsxs("div",{className:"detail-item",children:[u.jsx("div",{className:"icon",children:u.jsx(Um,{})}),u.jsx("h3",{children:"Email Support"}),u.jsx("p",{children:"For general inquiries and support:"}),u.jsx("a",{href:"mailto:support@empylo.com",children:"support@empylo.com"})]}),u.jsxs("div",{className:"detail-item",children:[u.jsx("div",{className:"icon",children:u.jsx($m,{})}),u.jsx("h3",{children:"Office"}),u.jsx("p",{children:"Global Headquarters"}),u.jsx("span",{children:"London, United Kingdom"})]})]})}),u.jsx("style",{children:`
        .contact-page {
          background: #F8FAFC;
        }
        
        .contact-details {
          padding-bottom: 100px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .detail-item {
          background: white;
          padding: 32px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        
        .detail-item .icon {
          font-size: 2rem;
          color: var(--color-primary);
          margin-bottom: 16px;
        }
        
        .detail-item h3 {
          font-size: 1.25rem;
          margin-bottom: 8px;
          color: #1E293B;
          font-weight: 700;
        }
        
        .detail-item p {
            color: #64748B;
            margin-bottom: 4px;
        }
        
        .detail-item a, .detail-item span {
            font-weight: 600;
            color: #0F172A;
            text-decoration: none;
        }

        @media(max-width: 768px) {
            .details-grid {
                grid-template-columns: 1fr;
            }
        }
      `})]});function sg(){return u.jsx(gm,{children:u.jsx(Yh,{children:u.jsxs(Ye,{path:"/",element:u.jsx(Xm,{}),children:[u.jsx(Ye,{index:!0,element:u.jsxs(u.Fragment,{children:[u.jsx(Jm,{}),u.jsx(Fs,{}),u.jsx(ng,{}),u.jsx(gd,{})]})}),u.jsx(Ye,{path:"features",element:u.jsx(Fs,{})}),u.jsx(Ye,{path:"about",element:u.jsx(ig,{})}),u.jsx(Ye,{path:"contact",element:u.jsx(ag,{})}),u.jsx(Ye,{path:"privacy-policy",element:u.jsx(rg,{})}),u.jsx(Ye,{path:"terms",element:u.jsx(lg,{})}),u.jsx(Ye,{path:"delete-account",element:u.jsx(og,{})})]})})})}ko.createRoot(document.getElementById("root")).render(u.jsx(ft.StrictMode,{children:u.jsx(sg,{})}));
