import {emblem, odometer} from './moteur.js';
import {color, clamp, ease, lerp, rgba, TAU, light,
  line, face, label, glass, floor, colorWash} from './mise-en-scene.js';

export function rings(ctx,x,y,r,time,tint,{progress=1,sweep=false}={}) {
  ctx.save();
  ctx.translate(x,y);
  const first=-Math.PI*.8;
  const arc=Math.PI*1.6;
  for(let j=0;j<4;j++) {
    ctx.beginPath();
    ctx.arc(0,0,r-j*10,j%2?0:first,j%2?TAU:first+arc);
    ctx.strokeStyle=rgba(tint,j===0?.44:.18);
    ctx.lineWidth=j===0?1.5:1;
    ctx.stroke();
  }
  ctx.beginPath();
  for(let i=0;i<=100;i++) {
    const a=first+arc*i/100;
    const r2=r+(i%10===0?19:i%5===0?12:5);
    ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
    ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
  }
  ctx.strokeStyle=rgba(tint,.54);
  ctx.lineWidth=1;
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.beginPath();
  ctx.arc(0,0,r-21,first,first+arc*clamp(progress));
  ctx.strokeStyle=rgba(tint,.7);
  ctx.lineWidth=3;
  ctx.stroke();
  if(sweep) {
    const a=first+arc*clamp(progress);
    const x=Math.cos(a)*(r-21),y=Math.sin(a)*(r-21);
    light(ctx,x,y,30,tint,.55);
  }
  ctx.restore();
  ctx.restore();
}

function bezier(a,b,c,d,p) {
  const q=1-p;
  return [q*q*q*a[0]+3*q*q*p*b[0]+3*q*p*p*c[0]+p*p*p*d[0],
          q*q*q*a[1]+3*q*q*p*b[1]+3*q*p*p*c[1]+p*p*p*d[1]];
}

export function flow(d, to, {from, time=d.age, streams=6, n=18, window=3.4}={}) {
  const {ctx,w,h,vertical:v}=d;
  const open=Math.min(1,Math.max(0,time)/window);
  let arrivals=0;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<streams;i++) {
    const u=i/Math.max(1,streams-1);
    const a=from?.[i%from.length]||[w*(-.06+u*.15),h*(.18+u*.44)];
    const b=[a[0]+w*(.21+.09*u),a[1]-(.21-u*.23)*h];
    const c=[to[0]-w*(.13+u*.09),to[1]+h*(.22-u*.39)];
    ctx.beginPath();ctx.moveTo(...a);ctx.bezierCurveTo(...b,...c,...to);
    ctx.strokeStyle=i%3===0?'#398DBD52':'#C27C2E45';
    ctx.lineWidth=1.3;ctx.stroke();
    ctx.beginPath();
    const bright=[];
    for(let j=0;j<n;j++) {
      const travel=2.8+((i*3+j*7)%13)*.16;
      const phase=(j+.26*i)/n*window*.55;
      const flight=(time-phase)/travel;
      if(flight>=1) arrivals++;
      if(flight<0) continue;
      const p=flight<=1?flight:(flight*.25+i*.013)%1;
      const tip=bezier(a,b,c,to,p);
      const previous=bezier(a,b,c,to,Math.max(0,p-.018));
      ctx.moveTo(...previous);ctx.lineTo(...tip);
      if(j%3===0) bright.push(tip);
    }
    ctx.strokeStyle=i%3===0?'#73D8FFD0':'#FFBA57A8';
    ctx.lineWidth=i%2?2.0:1.3;ctx.stroke();
    ctx.beginPath();
    for(const [x,y] of bright) {
      ctx.moveTo(x+2,y);ctx.arc(x,y,2,0,TAU);
    }
    ctx.fillStyle=i%3===0?'#EBFCFF':'#FFE1AC';
    ctx.fill();
  }
  light(ctx,to[0],to[1],v?80:96,color.amber,.26+.06*Math.sin(time*2)*open);
  ctx.restore();
  return arrivals/(streams*n);
}

export function gauge(d,{
  value,unit='',prefix='',description='',dec=0,flowing=false,down=false,
  from,to,tint=d.tint,progress,
}={}) {
  const {ctx,w,h,vertical:v,t,age,bare}=d;
  floor(d,tint,tint===color.amber);
  const cx=w*(v?.477:.52);
  const cy=h*(v?.442:.455);
  const r=v?264:240;
  const charge=Math.min(1.8,d.shotDuration*.60);
  const hit=flowing?flow(d,to||[cx,cy+3],{from,time:age*Math.max(1.8,3.6/charge)}):
    ease(age/(down?30:charge));
  const u=clamp(progress??hit);
  rings(ctx,cx,cy,r,t,tint,{progress:u,sweep:true});
  light(ctx,cx,cy,r*1.15,tint,.15);
  if(!bare) {
    const counted=down?Math.max(0,value-age):value*u;
    odometer(ctx,counted,cx,cy+44,{
      size:v?110:135,weight:850,dec,prefix,suffix:unit,suffixScale:.43,color:color.white,
      suffixColor:tint,glow:6,glowColor:tint,spacing:1,roll:true,
    });
    label(ctx,description,cx,cy+103,{size:v?20:22,width:r*1.5,mono:true,tint:color.slate});
  }
  colorWash(ctx,w,h,.90);
}

export function dualNumbers(d, a, b, {tintA=color.cyan,tintB=color.amber,slash=false}={}) {
  const {ctx,w,h,vertical:v,age,t,bare}=d;
  floor(d,tintB,true);
  const cx=w*(v?.47:.5);
  const spread=v?177:341;
  const mid=h*(v?.43:.43);
  const r=v?151:230;
  const p=ease(age/1.6);
  const positions=[
    {x:cx-spread,y:mid-(v?96:0), data:a,tint:tintA,progress:p},
    {x:cx+spread,y:mid+(v?96:0), data:b,tint:tintB,progress:ease((age-.28)/1.45)},
  ];
  positions.forEach(({x,y,data,tint,progress})=>{
    rings(ctx,x,y,r,t,tint,{progress,sweep:true});
    if(!bare) {
      const [number,unit,description,dec=0,prefix='']=data;
      odometer(ctx,number*progress,x,y+(v?28:43),{
        size:v?66:110,weight:850,dec,prefix,suffix:unit,suffixScale:.48,
        color:color.white,suffixColor:tint,glow:4,glowColor:tint,spacing:0,
      });
      label(ctx,description,x,y+r*.42,{size:v?18:22,width:r*1.45,mono:true,tint});
    }
  });
  if(slash) {
    const a0=positions[0];
    const length=ease((age-.72)/1.15)*r*.78;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    line(ctx,[[a0.x-r*.69,a0.y+r*.50],[a0.x-r*.69+length*1.7,a0.y+r*.50-length*1.4]],color.rose,6);
    ctx.restore();
  }
  colorWash(ctx,w,h,.88);
}

export function compass(d,{vote=false}={}) {
  const {ctx,w,h,vertical:v,t}=d;
  floor(d,vote?color.amber:color.cyan);
  const x=w*(v?.472:.50);
  const y=h*(v?.443:.456);
  const r=v?226:209;
  for(let j=0;j<4;j++) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate((j%2?1:-1)*t*(.07+j*.02));
    ctx.scale(1,.62+.10*j);
    rings(ctx,0,0,r*(.79+j*.16),t,[color.cyan,color.amber][j%2],{progress:.55,sweep:false});
    ctx.restore();
  }
  light(ctx,x,y,r*1.65,color.cyan,.24);
  emblem(ctx,x,y,r*.68,{ringT:1,needle:1,star:1,time:t*.35,swing:Math.sin(t*.28)*.08,cardinals:false});
  colorWash(ctx,w,h,.84);
}
