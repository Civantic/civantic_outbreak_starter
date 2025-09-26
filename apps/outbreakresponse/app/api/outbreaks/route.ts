export const dynamic = 'force-dynamic'

import { NextResponse } from "next/server"

const CDC = "https://data.cdc.gov/resource/5xkq-dg7x.json"

function n(x:any){const v=Number(x);return Number.isFinite(v)?v:0}
function map(r:any,i:number){
  const y=n(r.year)||new Date().getFullYear(),m=n(r.month)||1
  const s=r.state||r.reporting_state||"",e=r.etiology||"Unknown"
  const ill=n(r.illnesses||r.number_ill),hosp=n(r.hospitalizations||r.number_hospitalized),d=n(r.deaths)
  const id=r.outbreak_id||r.incident_id||`nors-${i}`
  const date=new Date(Date.UTC(y,Math.max(0,m-1),1)).toISOString().slice(0,10)
  return { id,date,state:s.toUpperCase(),etiology:e,illnesses:ill,hospitalizations:hosp,deaths:d,source:"CDC NORS" }
}

export async function GET(req:Request){
  const u=new URL(req.url)
  const scope=(u.searchParams.get("scope")||"US").toUpperCase()
  const months=Number(u.searchParams.get("months")||"6")
  const et=(u.searchParams.get("etiology")||"").toLowerCase().trim()
  const end=new Date(); const start=new Date(end.getFullYear(),end.getMonth(),1); start.setMonth(start.getMonth()-months+1)
  const url=new URL(CDC)
  url.searchParams.set("$select","year,month,state,reporting_state,etiology,illnesses,hospitalizations,deaths,incident_id,outbreak_id")
  url.searchParams.set("$where",`year >= ${start.getFullYear()}`)
  url.searchParams.set("$limit","5000")
  const headers:any={}
  if(process.env.CDC_APP_TOKEN) headers["X-App-Token"]=process.env.CDC_APP_TOKEN as string
  try{
    const r=await fetch(url.toString(),{headers,next:{revalidate:3600}})
    if(!r.ok) throw new Error(String(r.status))
    let rows=await r.json() as any[]
    if(scope==="NM") rows=rows.filter(x=>(x.state||x.reporting_state||"").toUpperCase()==="NM")
    let data=rows.map(map)
    if(et) data=data.filter(d=>String(d.etiology||"").toLowerCase().includes(et))
    return NextResponse.json({ data, fetchedAt:new Date().toISOString() })
  }catch{
    const demo=(await import("../../data/demo")).outbreaks
    let data=demo.map(x=>({ ...x, state:String(x.state||"").toUpperCase(), source:"CDC NORS" }))
    if(scope==="NM") data=data.filter(d=>d.state==="NM")
    if(et) data=data.filter(d=>String(d.etiology||"").toLowerCase().includes(et))
    return NextResponse.json({ data, fallback:true, fetchedAt:new Date().toISOString() })
  }
}
