
import React, {useMemo, useRef, useState} from "react";
import { createRoot } from "react-dom/client";
import { mbtiDescriptions } from "./mbtiData";
import "./styles.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const pairs = [
  ["I","E","Introversion","Extraversion"],
  ["S","N","Sensing","Intuition"],
  ["T","F","Thinking","Feeling"],
  ["J","P","Judging","Perceiving"]
];

const sectionOrder = [
  "DOMINAN","KARAKTERISITIK UMUM","KEKUATAN","RELATIONSHIP",
  "PENGAMBILAN KEPUTUSAN","MEMPERLAKUKAN INFORMASI","GAYA KOMUNIKASI",
  "FAKTOR KEPUASAN","PEMIMPIN & PENGIKUT","PERILAKU SAAT KECEWA/STRES",
  "PERILAKU SAAT DEPRESI/STRES BERAT","PANDANGAN ORANG AWAM",
  "YANG PERLU DIWASPADAI","SARAN"
];

function today(){
  return new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
}

function App(){
  const [bio,setBio]=useState({nama:"",nip:"",jabatan:"",unit:"",tanggal:today()});
  const [scores,setScores]=useState({I:0,E:0,S:0,N:0,T:0,F:0,J:0,P:0});
  const reportRef=useRef(null);

  const result=useMemo(()=>{
    const letters = pairs.map(([a,b]) => Number(scores[a]) >= Number(scores[b]) ? a : b).join("");
    const validity = pairs.map(([a,b]) => ({pair:a+b,total:Number(scores[a]||0)+Number(scores[b]||0),ok:Number(scores[a]||0)+Number(scores[b]||0)===15}));
    return {type:letters, desc:mbtiDescriptions[letters] || {}, validity};
  },[scores]);

  function setScore(k,v){
    const n = Math.max(0, Math.min(15, Number(v || 0)));
    setScores({...scores,[k]:n});
  }

  async function downloadPdf(){
    const el=reportRef.current;
    const canvas=await html2canvas(el,{scale:2,useCORS:true});
    const img=canvas.toDataURL("image/png");
    const pdf=new jsPDF("p","mm","a4");
    const w=210, h=canvas.height*w/canvas.width;
    let y=0, pageH=297;
    pdf.addImage(img,"PNG",0,y,w,h);
    let left=h-pageH;
    while(left>0){
      y-=pageH;
      pdf.addPage();
      pdf.addImage(img,"PNG",0,y,w,h);
      left-=pageH;
    }
    pdf.save(`Laporan-MBTI-${bio.nama || result.type}.pdf`);
  }

  return <div className="app">
    <div className="hero">
      <h1>MYERS-BRIGGS TYPE INDICATOR</h1>
      <p>Aplikasi laporan MBTI berbasis web, siap deploy melalui GitHub ke Vercel.</p>
    </div>

    <div className="grid">
      <div className="card input-panel">
        <h2>Input Data Peserta</h2>
        {[
          ["nama","Nama"],["nip","NIP"],["jabatan","Jabatan"],["unit","Unit Kerja"],["tanggal","Tanggal"]
        ].map(([k,l])=><div className="field" key={k}>
          <label>{l}</label><input value={bio[k]} onChange={e=>setBio({...bio,[k]:e.target.value})}/>
        </div>)}

        <h2>Input Hasil Skoring</h2>
        <p className="muted">Isi skor pasangan. Seperti Excel, setiap pasangan idealnya berjumlah 15.</p>
        {pairs.map(([a,b,la,lb])=><div key={a+b}>
          <div className="score-row">
            <b>{a}</b><input type="number" min="0" max="15" value={scores[a]} onChange={e=>setScore(a,e.target.value)}/>
            <b>{b}</b><input type="number" min="0" max="15" value={scores[b]} onChange={e=>setScore(b,e.target.value)}/>
          </div>
          <div className={"status "+(Number(scores[a])+Number(scores[b])===15?"ok":"bad")}>
            {la} + {lb} = {Number(scores[a])+Number(scores[b])} / 15
          </div>
        </div>)}

        <div className="btns">
          <button className="btn" onClick={()=>window.print()}>Print / Save PDF</button>
          <button className="btn secondary" onClick={downloadPdf}>Download PDF</button>
        </div>
      </div>

      <div className="card report" ref={reportRef}>
        <div className="report-header">
          <h1>MYERS-BRIGGS TYPE INDICATOR</h1>
          <h3>INTERPRETIVE REPORT</h3>
        </div>

        <div className="bio">
          <b>NAMA</b><span>:</span><span>{bio.nama || "-"}</span>
          <b>NIP</b><span>:</span><span>{bio.nip || "-"}</span>
          <b>JABATAN</b><span>:</span><span>{bio.jabatan || "-"}</span>
          <b>UNIT KERJA</b><span>:</span><span>{bio.unit || "-"}</span>
          <b>TANGGAL</b><span>:</span><span>{bio.tanggal || "-"}</span>
        </div>

        <div className="type-box">
          <div className="big-type">
            <div>{result.type}</div>
            <div>PERSONALITY TYPE</div>
          </div>
          <div className="letters">
            {pairs.map(([a,b,la,lb],i)=>{
              const chosen=result.type[i];
              return <div className="letter" key={a+b}>
                <b>{chosen}</b>
                <div>{chosen===a?la:lb}</div>
              </div>
            })}
          </div>
        </div>

        <div className="bars">
          {pairs.map(([a,b])=>{
            const av=Number(scores[a]||0), bv=Number(scores[b]||0), total=Math.max(av+bv,1);
            const left=av/total*50, right=bv/total*50;
            return <div className="bar-line" key={a+b}>
              <b>{a}</b>
              <div className={"bar "+(av>=bv?"left":"right")}>
                <span style={{width:`${av>=bv?left:right}%`}}></span>
              </div>
              <b>{b}</b>
            </div>
          })}
        </div>

        {result.validity.some(v=>!v.ok) && <div className="status bad">
          Perhatian: ada pasangan skor yang belum berjumlah 15. Laporan tetap ditampilkan, tetapi cek kembali input skoring.
        </div>}

        {sectionOrder.map(sec=>{
          const items=result.desc[sec]?.filter(Boolean) || [];
          if(!items.length) return null;
          return <div className="section" key={sec}>
            <h3>{sec}</h3>
            <ul>{items.map((x,i)=><li key={i}>{x}</li>)}</ul>
          </div>
        })}

        <div className="disclaimer">
          Catatan: Laporan ini mengikuti logika workbook Excel yang diberikan. Hasil MBTI bersifat deskriptif dan sebaiknya digunakan sebagai bahan refleksi/pengembangan, bukan diagnosis klinis.
        </div>
      </div>
    </div>
  </div>
}

createRoot(document.getElementById("root")).render(<App />);
