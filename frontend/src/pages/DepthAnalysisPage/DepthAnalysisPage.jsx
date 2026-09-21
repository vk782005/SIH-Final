import { useEffect, useState } from "react";
import "./DepthAnalysisPage.css";

const DEPTHS=[0,25,50,75,100,150,200,300,400,500,650,800,1000,1200];

const DATA={
  temperature:{label:"Temperature",unit:"°C",color:"#d9784f",values:[28.4,28.1,27.7,26.8,25.4,23.2,21.0,18.7,15.9,13.2,10.7,8.9,7.1,6.2]},
  salinity:{label:"Salinity",unit:"PSU",color:"#6e9ab5",values:[34.7,34.75,34.8,34.85,34.9,34.96,35.0,35.08,35.17,35.25,35.32,35.38,35.42,35.45]},
  chlorophyll:{label:"Chlorophyll-a",unit:"mg/m³",color:"#78966f",values:[0.18,0.2,0.22,0.3,0.46,0.72,0.92,0.71,0.48,0.22,0.12,0.06,0.03,0.02]},
  current:{label:"Current speed",unit:"m/s",color:"#8978a1",values:[0.38,0.37,0.35,0.33,0.31,0.29,0.26,0.22,0.18,0.15,0.12,0.10,0.08,0.06]}
};
const LOCATIONS=[
  {name:"Equatorial Indian Ocean",lat:"0.00° N",lon:"75.00° E"},
  {name:"Arabian Sea",lat:"15.20° N",lon:"68.40° E"},
  {name:"Bay of Bengal",lat:"14.10° N",lon:"88.20° E"}
];
const MODES=[["profile","Profile"],["watermass","Water mass"],["temporal","Temporal"],["transect","Transect"],["diagnostics","Diagnostics"]];

function lerp(depth,values){
  if(depth<=DEPTHS[0])return values[0];
  if(depth>=DEPTHS.at(-1))return values.at(-1);
  for(let i=0;i<DEPTHS.length-1;i++){
    if(depth>=DEPTHS[i]&&depth<=DEPTHS[i+1]){
      const t=(depth-DEPTHS[i])/(DEPTHS[i+1]-DEPTHS[i]);
      return values[i]+(values[i+1]-values[i])*t;
    }
  }
  return values[0];
}
function gradient(depth,values){
  const d1=Math.max(0,depth-5),d2=Math.min(1200,depth+5);
  return(lerp(d2,values)-lerp(d1,values))/Math.max(1,d2-d1);
}
function layerName(depth){
  if(depth<75)return"Surface mixed layer";
  if(depth<300)return"Thermocline / transition";
  if(depth<800)return"Mesopelagic";
  return"Deep ocean";
}
function scale(v,min,max,a,b){return a+((v-min)/(max-min||1))*(b-a)}

function SvgProfile({parameter,depth,setDepth,compareDepth}){
  const W=760,H=390,p={l:66,r:24,t:22,b:48};
  const min=Math.min(...parameter.values),max=Math.max(...parameter.values);
  const x=v=>scale(v,min,max,p.l,W-p.r),y=d=>p.t+(d/1200)*(H-p.t-p.b);
  const pts=DEPTHS.map((d,i)=>`${x(parameter.values[i])},${y(d)}`).join(" ");
  const sx=x(lerp(depth,parameter.values)),sy=y(depth),ry=y(compareDepth);
  const click=e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const py=(e.clientY-r.top)/r.height*H;
    setDepth(Math.round(Math.max(0,Math.min(1200,((py-p.t)/(H-p.t-p.b))*1200))/5)*5);
  };
  return <div className="rb-chart-shell"><svg className="rb-profile-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" onPointerDown={click}>
    {[0,200,400,600,800,1000,1200].map(d=><g key={d}><line className="rb-grid" x1={p.l} x2={W-p.r} y1={y(d)} y2={y(d)}/><text className="rb-axis" x={p.l-12} y={y(d)+4} textAnchor="end">{d}</text></g>)}
    <polyline className="rb-profile" points={pts} style={{stroke:parameter.color}}/>
    <line className="rb-reference" x1={p.l} x2={W-p.r} y1={ry} y2={ry}/>
    <text className="rb-ref-label" x={W-p.r} y={ry-7} textAnchor="end">{compareDepth} m reference</text>
    <line className="rb-cursor" x1={p.l} x2={W-p.r} y1={sy} y2={sy}/><circle className="rb-selected" cx={sx} cy={sy} r="8"/>
    <text className="rb-selected-label" x={W-p.r} y={sy-10} textAnchor="end">{Math.round(depth)} m · {lerp(depth,parameter.values).toFixed(2)} {parameter.unit}</text>
    <text className="rb-axis-title" transform={`translate(18 ${H/2}) rotate(-90)`}>DEPTH (m)</text>
    <text className="rb-axis-title" x={p.l} y={H-12}>{parameter.unit}</text>
  </svg></div>
}

function OceanProbe({depth,parameter}){
  const pct=depth/1200;
  return <div className="rb-ocean">
    <div className="rb-water-surface" style={{opacity:.35+(1-pct)*.55}}/><div className="rb-rays" style={{opacity:.04+(1-pct)*.18}}/>
    <div className="rb-ocean-gradient" style={{opacity:.15+pct*.55}}/>
    <div className="rb-particles">{Array.from({length:42},(_,i)=><i key={i} style={{left:`${(i*29)%96}%`,top:`${(i*47)%98}%`,animationDelay:`${-(i%8)}s`,animationDuration:`${5+i%7}s`}}/>)}</div>
    <div className="rb-ocean-life" style={{opacity:Math.max(0,.34-pct*.22)}}><span className="rb-fish one">◁</span><span className="rb-fish two">◀</span><span className="rb-jelly">◯</span></div>
    <div className="rb-ruler">{[0,200,400,600,800,1000,1200].map(d=><span key={d} style={{top:`${d/1200*100}%`}}>{d}m</span>)}</div>
    <div className="rb-probe-line" style={{top:`${pct*100}%`}}><b/><span>{Math.round(depth)} m</span></div>
    <div className="rb-ocean-reading"><strong>{lerp(depth,parameter.values).toFixed(2)}</strong><span>{parameter.unit}</span><small>{parameter.label}</small></div>
    <div className="rb-ocean-layer">{layerName(depth)}</div><div className="rb-ocean-scrub">DRAG THE WATER COLUMN TO MOVE THE PROBE</div>
  </div>
}

function HeatMap({depth,setDepth}){
  const cells = Array.from(
  { length: 22 },
  (_, r) =>
    Array.from(
      { length: 28 },
      (_, c) =>
        Math.max(
          0,
          Math.min(
            1,
            0.5 +
              Math.sin(c * 0.38 + r * 0.16) * 0.22 +
              Math.cos(r * 0.47) * 0.18
          )
        )
    )
);
  const click=e=>{const r=e.currentTarget.getBoundingClientRect();const y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));setDepth(Math.round(y*1200/5)*5)};
  return <div className="rb-heat"><div className="rb-heat-grid" onPointerDown={click}>{cells.flat().map((v,i)=><i key={i} style={{opacity:.16+v*.78}}/>)}<b style={{top:`${depth/1200*100}%`}}/></div><div className="rb-heat-x"><span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>NOV</span></div><div className="rb-heat-legend"><span>LOW</span><i/><span>HIGH</span></div></div>
}

function TSPlot({depth,setDepth}){
  const t=DATA.temperature,s=DATA.salinity,W=520,H=290,p={l:52,r:20,t:20,b:42};
  const tx=v=>scale(v,5.5,29,p.l,W-p.r),sy=v=>scale(v,34.5,35.6,H-p.b,p.t);
  return <div className="rb-ts"><svg viewBox={`0 0 ${W} ${H}`}><polyline className="rb-ts-line" points={DEPTHS.map((d,i)=>`${tx(t.values[i])},${sy(s.values[i])}`).join(" ")}/>{DEPTHS.map((d,i)=><circle key={d} className="rb-ts-point" cx={tx(t.values[i])} cy={sy(s.values[i])} r="4" onClick={()=>setDepth(d)}/>)}<circle className="rb-ts-current" cx={tx(lerp(depth,t.values))} cy={sy(lerp(depth,s.values))} r="8"/><text className="rb-axis-title" x={W/2} y={H-5} textAnchor="middle">TEMPERATURE (°C)</text><text className="rb-axis-title" transform={`translate(15 ${H/2}) rotate(-90)`} textAnchor="middle">SALINITY (PSU)</text></svg></div>
}

function GradientPanel({depth,parameter,axis}){
  const values=parameter.values;
  const grad=gradient(depth,values);
  const maxG=Math.max(...DEPTHS.map(d=>Math.abs(gradient(d,values))));
  const label=axis==="vertical"?"Vertical gradient · ∂/∂z":"Temporal gradient · ∂/∂t";
  const unit=axis==="vertical"?`${parameter.unit}/m`:`${parameter.unit}/month`;
  return <div className="rb-gradient-panel">
    <div className="rb-gradient-big">{grad>=0?"+":""}{grad.toFixed(4)} <small>{unit}</small></div>
    <div className="rb-gradient-name">{label}</div>
    <div className="rb-gradient-scale"><span>DECREASING</span><i/><span>INCREASING</span></div>
    <div className="rb-gradient-meta"><span>AT {Math.round(depth)} m</span><strong>MAGNITUDE {Math.min(100,Math.abs(grad)/Math.max(maxG,.0001)*100).toFixed(0)}%</strong></div>
  </div>
}

function Transect({depth,setDepth,transectMetric}){
  const rows=24,cols=40;
  const gradientMode=transectMetric!=="value";
  const cells=Array.from({length:rows*cols},(_,i)=>{
    const r=Math.floor(i/cols),c=i%cols;
    const base=.5+.4*Math.sin(c*.23+r*.4);
    const g=Math.abs(Math.cos(c*.23+r*.4));
    return gradientMode?Math.max(0,Math.min(1,g)):Math.max(0,Math.min(1,base));
  });
  const click=e=>{const r=e.currentTarget.getBoundingClientRect();const y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));setDepth(Math.round(y*1200/5)*5)};
  return <div className="rb-transect-wrap">
    <div className="rb-transect-grid" onPointerDown={click}>{cells.map((v,i)=><i key={i} style={{opacity:.1+v*.82}}/>)}<b style={{top:`${depth/1200*100}%`}}/></div>
    <div className="rb-transect-labels"><span>65°E</span><span>70°E</span><span>75°E</span><span>80°E</span><span>85°E</span></div>
    <div className="rb-transect-depths"><span>0</span><span>300</span><span>600</span><span>900</span><span>1200 m</span></div>
    <div className="rb-transect-probe" style={{top:`${depth/1200*100}%`}}/>
    <div className="rb-transect-read"><span>{transectMetric==="value"?"FIELD VALUE":"GRADIENT MAGNITUDE"}</span><strong>{gradientMode?"0.074":"24.8"}</strong><small>{gradientMode?"°C / °longitude":"°C"}</small></div>
  </div>
}

export default function DepthAnalysisPage({ onNavigate, onOpenGlobe }){
  const[mode,setMode]=useState("profile"),[parameterKey,setParameterKey]=useState("temperature"),[depth,setDepth]=useState(240),[compareDepth,setCompareDepth]=useState(500),[location,setLocation]=useState(0),[autoSweep,setAutoSweep]=useState(false),[temporalMetric,setTemporalMetric]=useState("value"),[transectMetric,setTransectMetric]=useState("value");
  const parameter=DATA[parameterKey],loc=LOCATIONS[location],selected=lerp(depth,parameter.values),g=gradient(depth,parameter.values);
  useEffect(()=>{if(!autoSweep)return;const id=setInterval(()=>setDepth(d=>d>=1200?0:d+5),45);return()=>clearInterval(id)},[autoSweep]);
  return <main className="research-bench">
    <header className="rb-header"><button className="da-workspace-back" type="button" onClick={() => onNavigate?.("analysis")}>← Analysis Lab</button><div className="rb-brand"><span className="rb-mark">O</span><div><small>OCEAN ANALYTICS / RESEARCH BENCH</small><h1>Depth Analysis</h1></div></div><div className="rb-location"><select value={location} onChange={e=>setLocation(+e.target.value)}>{LOCATIONS.map((x,i)=><option key={x.name} value={i}>{x.name}</option>)}</select><span>{loc.lat}</span><span>{loc.lon}</span><span className="rb-live"><i/> LIVE PROFILE</span><button className="explore-globe-button depth-explore-globe" type="button" onClick={onOpenGlobe || (() => onNavigate?.("explorer"))} aria-label="Return to Ocean Explorer globe"><span className="explore-globe-icon" aria-hidden="true">◎</span> EXPLORE GLOBE</button></div></header>
    <nav className="rb-modebar">{MODES.map(([k,l])=><button key={k} className={mode===k?"active":""} onClick={()=>setMode(k)}>{l}</button>)}<div className="rb-modebar-spacer"/><label>PARAMETER</label><select value={parameterKey} onChange={e=>setParameterKey(e.target.value)}>{Object.entries(DATA).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select><label>REFERENCE</label><select value={compareDepth} onChange={e=>setCompareDepth(+e.target.value)}>{DEPTHS.map(d=><option key={d}>{d} m</option>)}</select></nav>
    <section className="rb-body">
      <aside className="rb-left"><div className="rb-section-head"><span>VERTICAL OBSERVATION</span><strong>{Math.round(depth)} m</strong></div><OceanProbe depth={depth} parameter={parameter}/><div className="rb-depth-control"><div className="rb-control-row"><span>DEPTH CONTROL</span><b>{Math.round(depth)} m</b></div><input type="range" min="0" max="1200" step="5" value={depth} onChange={e=>setDepth(+e.target.value)}/><div className="rb-slider-labels"><span>0</span><span>600</span><span>1200 m</span></div></div><div className="rb-left-actions"><button onClick={()=>setDepth(Math.max(0,depth-25))}>−25 m</button><button className={autoSweep?"selected":""} onClick={()=>setAutoSweep(v=>!v)}>{autoSweep?"PAUSE SWEEP":"RUN DEPTH SWEEP"}</button><button onClick={()=>setDepth(Math.min(1200,depth+25))}>+25 m</button></div><div className="rb-status"><span>LAYER</span><strong>{layerName(depth)}</strong><span>VERTICAL GRADIENT</span><strong>{g.toFixed(4)} {parameter.unit}/m</strong></div></aside>
      <section className="rb-main">
        {mode==="profile"&&<><div className="rb-main-title"><div><span>PRIMARY PROFILE / VERTICAL STRUCTURE</span><h2>{parameter.label} vs depth</h2></div><div className="rb-title-reading">{selected.toFixed(2)} <small>{parameter.unit}</small></div></div><div className="rb-profile-layout"><div className="rb-panel profile-panel"><div className="rb-panel-head"><span>OBSERVATION PROFILE</span><small>CLICK / DRAG TO SELECT DEPTH</small></div><SvgProfile parameter={parameter} depth={depth} setDepth={setDepth} compareDepth={compareDepth}/></div><div className="rb-panel inspector"><div className="rb-panel-head"><span>RESEARCH PROBE</span><small>SELECTED POINT</small></div><div className="rb-probe-number">{Math.round(depth)}<small>m</small></div><div className="rb-read-grid"><div><span>TEMPERATURE</span><b>{lerp(depth,DATA.temperature.values).toFixed(2)} °C</b></div><div><span>SALINITY</span><b>{lerp(depth,DATA.salinity.values).toFixed(2)} PSU</b></div><div><span>CHLOROPHYLL</span><b>{lerp(depth,DATA.chlorophyll.values).toFixed(2)} mg/m³</b></div><div><span>CURRENT</span><b>{lerp(depth,DATA.current.values).toFixed(2)} m/s</b></div></div><div className="rb-layer-box"><span>INTERPRETED LAYER</span><strong>{layerName(depth)}</strong><p>The probe follows the selected depth across every analysis panel.</p></div></div></div><div className="rb-bottom-grid"><div className="rb-panel"><div className="rb-panel-head"><span>DEPTH × TIME</span><small>SEASONAL FIELD</small></div><HeatMap depth={depth} setDepth={setDepth}/></div><div className="rb-panel"><div className="rb-panel-head"><span>VERTICAL GRADIENT</span><small>∂/∂z</small></div><GradientPanel depth={depth} parameter={parameter} axis="vertical"/></div></div></>}
        {mode==="watermass"&&<><div className="rb-main-title"><div><span>WATER-MASS IDENTIFICATION</span><h2>Temperature–Salinity analysis</h2></div><div className="rb-title-reading">{Math.round(depth)} m</div></div><div className="rb-mode-grid"><div className="rb-panel large-panel"><div className="rb-panel-head"><span>T–S DIAGRAM</span><small>DEPTH COLOUR ENCODED</small></div><TSPlot depth={depth} setDepth={setDepth}/></div><div className="rb-panel"><div className="rb-panel-head"><span>WATER-MASS PROBE</span></div><div className="rb-probe-number">{Math.round(depth)}<small>m</small></div><div className="rb-watermass-class"><span>CLASSIFICATION</span><strong>{depth<150?"Surface water":depth<500?"Subsurface transition":depth<900?"Intermediate water":"Deep water"}</strong></div></div></div></>}
        {mode==="temporal"&&<><div className="rb-main-title"><div><span>TEMPORAL EVOLUTION</span><h2>Depth × time field</h2></div><div className="rb-title-reading">∂/∂t</div></div><div className="rb-panel temporal-panel"><div className="rb-panel-head"><span>{parameter.label} / TIME × DEPTH</span><div className="rb-metric-switch"><button className={temporalMetric==="value"?"on":""} onClick={()=>setTemporalMetric("value")}>VALUE</button><button className={temporalMetric==="gradient"?"on":""} onClick={()=>setTemporalMetric("gradient")}>TEMPORAL GRADIENT</button></div></div><HeatMap depth={depth} setDepth={setDepth}/><div className="rb-time-controls"><button onClick={()=>setAutoSweep(v=>!v)}>{autoSweep?"PAUSE":"PLAY DEPTH"}</button><input type="range" min="0" max="1200" step="5" value={depth} onChange={e=>setDepth(+e.target.value)}/><span>{Math.round(depth)} m</span></div></div><div className="rb-bottom-grid"><div className="rb-panel"><div className="rb-panel-head"><span>TEMPORAL RESPONSE</span><small>∂{parameter.label[0]}/∂t</small></div><GradientPanel depth={depth} parameter={parameter} axis="temporal"/></div><div className="rb-panel"><div className="rb-panel-head"><span>INTERPRETATION</span></div><div className="rb-stat-big">{depth<250?"Strong seasonal coupling":"Weak seasonal coupling"}</div><p className="rb-muted">{depth<250?"Surface waters retain stronger temporal variability.":"The deep layer is comparatively buffered from seasonal forcing."}</p></div></div></>}
        {mode==="transect"&&<><div className="rb-main-title"><div><span>SPATIAL CROSS-SECTION</span><h2>Longitude × depth transect</h2></div><div className="rb-title-reading">∇{parameter.label[0]}</div></div><div className="rb-panel transect-panel"><div className="rb-panel-head"><span>INDIAN OCEAN TRANSECT</span><div className="rb-metric-switch"><button className={transectMetric==="value"?"on":""} onClick={()=>setTransectMetric("value")}>FIELD VALUE</button><button className={transectMetric==="horizontal"?"on":""} onClick={()=>setTransectMetric("horizontal")}>HORIZONTAL GRADIENT</button><button className={transectMetric==="vertical"?"on":""} onClick={()=>setTransectMetric("vertical")}>VERTICAL GRADIENT</button></div></div><Transect depth={depth} setDepth={setDepth} transectMetric={transectMetric}/></div><div className="rb-bottom-grid"><div className="rb-panel"><div className="rb-panel-head"><span>HORIZONTAL STRUCTURE</span><small>∂/∂x</small></div><GradientPanel depth={depth} parameter={parameter} axis="temporal"/></div><div className="rb-panel"><div className="rb-panel-head"><span>SECTION INTERPRETATION</span></div><div className="rb-stat-big">{depth<300?"Strong near-surface structure":"Deep-ocean spatially smooth"}</div><p className="rb-muted">The cross-section reveals where the parameter changes most strongly along the selected longitude band and depth.</p></div></div></>}
        {mode==="diagnostics"&&<><div className="rb-main-title"><div><span>DIAGNOSTICS / DATA QUALITY</span><h2>Profile diagnostics</h2></div><div className="rb-title-reading">QUALITY CONTROL</div></div><div className="rb-diagnostics">{[["Observation completeness","96.8%","HIGH"],["Vertical resolution","5–100 m","VARIABLE"],["Spatial interpolation","LOW","GOOD"],["Temporal coverage","12 months","HIGH"],["Missing values","3.2%","ACCEPTABLE"],["Profile confidence","86%","GOOD"]].map(([a,b,c])=><div className="rb-panel rb-diagnostic" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small><div><i style={{width:`${c==="HIGH"?94:c==="GOOD"?86:c==="ACCEPTABLE"?72:65}%`}}/></div></div>)}</div></>}
      </section>
    </section>
    <footer className="rb-footer"><span>DATASET / OCEAN PROFILE WORKSTATION</span><span>DEPTH RANGE 0–1200 m</span><span>POINT {loc.lat} / {loc.lon}</span><span className="rb-footer-right">SCIENTIFIC VISUALIZATION · DESKTOP MODE</span></footer>
  </main>
}
