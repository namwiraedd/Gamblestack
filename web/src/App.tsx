import React, { useEffect, useState } from "react";
import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App(){
  const [markets, setMarkets] = useState<any[]>([]);
  useEffect(()=> {
    axios.get(`${API}/sportsbook/markets`).then(r => setMarkets(r.data)).catch(()=>{});
  },[]);
  return (
    <div style={{fontFamily:"system-ui", padding:20}}>
      <h1>Gamblestack - Demo</h1>
      <section>
        <h2>Markets</h2>
        {markets.map(m => (
          <div key={m.id} style={{border:"1px solid #eee", padding:8, margin:8}}>
            <div>{m.sport} — {m.teams?.join(" vs ")}</div>
            <div>Odds: {JSON.stringify(m.odds)}</div>
          </div>
        ))}
      </section>
      <section style={{marginTop:20}}>
        <h2>Provably-fair demo</h2>
        <p>Use the API to /games/seed/commit and /games/spin</p>
      </section>
    </div>
  );
}
