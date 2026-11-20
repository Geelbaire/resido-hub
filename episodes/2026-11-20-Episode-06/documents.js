import {color, clamp, ease, spring, lerp, rgba, line, face, label, glass,
  lens, floor, colorWash, TAU} from './mise-en-scene.js';

function page(ctx,{
  x,y,w,h,angle,skew,heading,fields,highlight,phase,kind,dark,bare,t,
}) {
  const theme=dark?{ink:'#E2F6F9',minor:'#A5BCC6',edge:'#5CBAD5',hi:'#DAB44873',
    first:'#22485D',last:'#0B1C31'}:
    {ink:'#13263A',minor:'#435A70',edge:'#FFFAE4',hi:'#FFE357',first:'#FEF9E8',last:'#CBCEBB'};
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.transform(1,0,skew,1,0,0);
  const body=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);
  body.addColorStop(0,theme.first);
  body.addColorStop(.37,dark?'#152B40':'#EEE9D8');
  body.addColorStop(1,theme.last);
  for(let j=8;j>=1;j--){
    ctx.fillStyle='rgba(0,0,0,.105)';
    ctx.fillRect(-w/2+j*1.5,-h/2+j*3,w,h);
  }
  ctx.fillStyle=body;
  ctx.fillRect(-w/2,-h/2,w,h);
  ctx.strokeStyle=theme.edge;
  ctx.lineWidth=1.35;
  ctx.strokeRect(-w/2,-h/2,w,h);
  ctx.fillStyle=dark?'#3D7989':'#D0D3BE';
  ctx.fillRect(-w/2,-h/2,w,h*.13);
  const margin=w*.09;
  if(!bare) {
    label(ctx,kind,-w/2+margin,-h*.433,{size:h*.029,mono:true,align:'left',width:w*.78,tint:theme.ink});
    label(ctx,heading,-w/2+margin,-h*.305,{size:h*.067,align:'left',width:w*.82,tint:theme.ink});
  }
  line(ctx,[[-w/2+margin,-h*.237],[w/2-margin,-h*.237]],theme.minor,1.65);
  const rowH=h*.112;
  for(let i=0;i<fields.length;i++) {
    const yy=-h*.161+i*rowH;
    if(i===highlight) {
      const marker=ctx.createLinearGradient(-w/2+margin-6,0,w/2-margin,0);
      marker.addColorStop(0,theme.hi);
      marker.addColorStop(.83,theme.hi);
      marker.addColorStop(1,'#EEDB4100');
      ctx.save();
      ctx.translate(-w/2+margin-7,yy+10);
      ctx.rotate(-.014);
      ctx.fillStyle=marker;
      ctx.fillRect(0,-h*.032,(w-2*margin)*phase,h*.064);
      ctx.restore();
    }
    if(!bare) {
      const item=fields[i];
      const left=-w/2+margin;
      if(Array.isArray(item)) {
        label(ctx,item[0],left,yy,{size:h*.035,width:w*.38,mono:true,align:'left',tint:theme.minor});
        label(ctx,item[1],w/2-margin,yy,{size:h*.042,width:w*.43,align:'right',tint:theme.ink});
      } else {
        label(ctx,item,left,yy,{size:h*.040,width:w*.80,weight:i===highlight?800:590,align:'left',tint:theme.ink});
      }
    }
    line(ctx,[[-w/2+margin,yy+rowH*.46],[w/2-margin,yy+rowH*.46]],rgba(theme.minor,.29),.8);
  }
  ctx.fillStyle=theme.minor;
  for(let i=0;i<66;i++) {
    if((i*i+7*i)%13<6) ctx.fillRect(w*.28+i*w*.00236,h*.378,i%3?1:2,h*.049);
  }
  ctx.restore();
}

export function dossier(d,{
  heading,fields,highlight=1,kind='FAC-SIMILÉ  /  RECONSTITUTION',dark=false,compare,
  tint=d.tint, magnify=true,
}={}) {
  const {ctx,w,h,vertical:v,t,age,bare}=d;
  floor(d,tint,!dark);
  const settled=ease(age/.95);
  const cx=w*(v?.48:.50);
  const cy=h*(v?.432:.435);
  const height=v?610:454;
  const width=v?526:666;
  const lay={
    x:cx+(compare?-(v?110:180):0),
    y:cy+24+(1-settled)*20-(compare && v?136:0),
    w:compare?width*.82:width,h:height*(compare?.84:1),
    angle:-.048,
    skew:.068,
    heading,fields,highlight,kind,dark,bare,t,
    phase:clamp((age-.35)*.65),
  };
  const second=compare&&{
    ...lay, x:cx+(v?115:265),y:cy+(v?188:12),angle:.052,
    heading:compare.heading,fields:compare.fields,highlight:compare.highlight??highlight,
    dark:compare.dark??true,
  };
  function drawPages() {
    if(second) page(ctx,second);
    page(ctx,lay);
  }
  drawPages();
  if(magnify) {
    const focus=ease((age-.20)/2.2);
    const size=v?105:125;
    const projection=lay.angle+lay.skew;
    const lx=lay.x+lay.w*lerp(-.38,-.115,focus);
    const ly=lay.y+lay.h*(-.163+highlight*.112)+lay.w*(-.11)*projection;
    const lensY=ly+(v?12:7)+(1-focus)*36;
    lens(ctx,lx,lensY,size,drawPages,tint);
    line(ctx,[[lx+size*.74,lensY+size*.68],[lx+size*1.23,lensY+size*1.13]],'#BDDCE59A',9);
    line(ctx,[[lx+size*.77,lensY+size*.67],[lx+size*1.23,lensY+size*1.09]],rgba(tint,.71),2);
  }
  colorWash(ctx,w,h,.92);
}

export function reader(d,{mode='policy',step=0}={}) {
  const {ctx,w,h,vertical:v,t,age,bare}=d;
  floor(d,mode==='policy'?color.cyan:color.emerald);
  const px=w*(v?.475:.52), py=h*(v?.445:.409);
  const sw=v?520:740,sh=v?575:465;
  function screen() {
    ctx.save();
    ctx.translate(px,py);
    ctx.rotate(-.052);
    ctx.transform(1,0,.075,1,0,0);
    glass(ctx,0,0,sw,sh,color.cyan,t,()=>{
      ctx.fillStyle='#172532';
      ctx.fillRect(-sw*.46,-sh*.452,sw*.92,sh*.12);
      for(let i=0;i<3;i++) {
        ctx.beginPath();ctx.arc(-sw*.425+i*14,-sh*.394,3.8,0,TAU);
        ctx.fillStyle=[color.rose,color.gold,color.emerald][i];ctx.fill();
      }
      if(!bare) label(ctx,mode==='req'?'quebec.ca  /  REQ':'clinique.example',0,-sh*.396,{
        width:sw*.57,size:20,mono:true,tint:color.slate,
      });
      ctx.fillStyle='#E5EDEB';
      ctx.fillRect(-sw*.46,-sh*.332,sw*.92,sh*.77);
      if(bare) return;
      const lx=-sw*.39;
      const left={width:sw*.78,size:v?25:28,align:'left',tint:'#1E3544'};
      if(mode==='req') {
        label(ctx,'Registre des entreprises',lx,-sh*.249,{...left,size:v?37:39});
        const request='Clinique du Quartier';
        ctx.fillStyle='#C1D9DB';
        ctx.fillRect(lx,-sh*.179,sw*.75,sh*.101);
        const typed=step?request:request.slice(0,Math.floor(ease(age/1.6)*request.length));
        label(ctx,typed,lx+11,-sh*.13,{...left,mono:true,size:23});
        [
          ['Nom exploité','Clinique du Quartier'],
          ['Actionnaire déclaré','Holding exemple inc.'],
          ['Domicile élu','Adresse de correspondance'],
          ['Bénéficiaires ultimes','Consulter la déclaration'],
        ].forEach(([field,value],i)=>{
          const y=sh*(.008+i*.098);
          if(i===1&&step) {
            ctx.fillStyle='#F7DA62';
            ctx.fillRect(lx-4,y-14,sw*.76*ease(age/1.4),29);
          }
          label(ctx,field,lx,y,{...left,mono:true,size:18,width:sw*.37});
          label(ctx,value,sw*.382,y,{...left,size:20,width:sw*.37,align:'right'});
        });
      } else {
        label(ctx,step?'Politique de confidentialité':'Clinique du Quartier',lx,-sh*.248,{...left,size:v?36:43});
        const scroll=step?1:ease(age/2.4);
        for(let i=0;i<5;i++){
          const y=-sh*.144+i*sh*.051-sh*.08*scroll;
          if(y < -sh*.165) continue;
          ctx.fillStyle='#6D8997A8';
          ctx.fillRect(lx,y,sw*(.51+(i%3)*.08),sh*.010);
        }
        const linkY=sh*(.294-.17*scroll);
        ctx.fillStyle=step?'#FFDD52':'#CFDFE0';
        ctx.fillRect(lx-3,linkY-18,sw*.74,36);
        label(ctx,step?'Entité déclarée : Holding exemple inc.':'Politique de confidentialité',lx+6,linkY,
          {...left,size:v?19:23,width:sw*.72});
      }
      label(ctx,'INTERFACE ILLUSTRATIVE',lx,sh*.391,{...left,size:15,mono:true,tint:'#476479'});
    });
    ctx.restore();
  }
  screen();
  if(step) {
    const rx=px+lerp(-85,68,ease(age/2.5));
    const ry=py+sh*.10;
    lens(ctx,rx,ry,v?107:112,screen,color.cyan);
  }
  colorWash(ctx,w,h,.88);
}
