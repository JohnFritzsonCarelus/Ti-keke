width:"100%", padding:"13px", borderRadius:14, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg,#FF3B5C,#A855F7)", color:"#fff", fontSize:15, fontWeight:700,
              }}>{plan==="free" ? t.unlock : t.upgrade} 💎</button>
            </div>

            {/* LANG */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", marginBottom:14 }}>{t.lang}</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {langList.map(([code,label]) => (
                  <div key={code} onClick={() => setLang(code)} style={{
                    flex:1, minWidth:80, textAlign:"center", padding:"10px 6px", borderRadius:14, fontSize:12, cursor:"pointer",
                    background: lang===code ? "linear-gradient(135deg,#FF3B5C,#A855F7)" : "rgba(255,255,255,0.06)",
                    border: lang===code ? "none" : "1px solid rgba(255,255,255,0.1)",
                    fontWeight: lang===code ? 700 : 400,
                  }}>{label}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MATCH POPUP */}
      {showMatch && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:200, animation:"fadeIn 0.3s ease" }}>
          <div style={{ display:"flex", gap:24, fontSize:80, marginBottom:24 }}>🧑🏾{showMatch.emoji}</div>
          <div style={{ fontSize:36, fontWeight:900, background:"linear-gradient(90deg,#FF3B5C,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:8 }}>{t.itsMatch}</div>
          <div style={{ fontSize:16, color:"rgba(255,255,255,0.6)", marginBottom:24 }}>{t.matchMsg}</div>
          <button onClick={() => { setShowMatch(null); openChat(showMatch); }} style={{ background:"linear-gradient(135deg,#FF3B5C,#A855F7)", border:"none", borderRadius:22, padding:"13px 36px", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer" }}>
            💬 {t.sendMsg.split("...")[0]}
          </button>
        </div>
      )}

      {/* PAYWALL */}
      {showPaywall && <PaywallModal />}

      {/* NAV */}
      <div style={G.nav}>
        {navItems.map(n => (
          <div key={n.key} onClick={() => { setTab(n.key); if(n.key!=="chat") setActiveChat(null); }} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", opacity:tab===n.key?1:0.35, transition:"opacity 0.15s" }}>
            <span style={{ fontSize:22 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:tab===n.key?700:400, background:tab===n.key?"linear-gradient(90deg,#FF3B5C,#A855F7)":"none", WebkitBackgroundClip:tab===n.key?"text":"unset", WebkitTextFillColor:tab===n.key?"transparent":"#fff" }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
