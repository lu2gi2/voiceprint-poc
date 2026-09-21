import React, { useState, useEffect } from 'react';

/* ==========================================================================
   ICON COMPONENT
   ========================================================================== */
const Icon = ({ name, size = 18, stroke = 1.8, style = {} }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    style
  };

  const paths = {
    grid: <g><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g>,
    mic: <g><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></g>,
    spark: <g><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></g>,
    trend: <g><path d="M3 17l6-6 4 4 8-9"/><path d="M16 6h5v5"/></g>,
    fileText: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></g>,
    bell: <g><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></g>,
    calendar: <g><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></g>,
    download: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g>,
    chevronDown: <path d="m6 9 6 6 6-6"/>,
    arrowRight: <g><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></g>,
    arrowLeft: <g><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></g>,
    settings: <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>,
    check: <path d="m5 12 4 4L19 6"/>,
    layers: <g><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></g>,
    search: <g><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></g>,
    award: <g><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></g>,
    refresh: <g><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></g>,
    info: <g><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></g>,
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    stop: <rect x="4" y="4" width="16" height="16" rx="2"/>,
    x: <g><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></g>,
    lock: <g><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></g>,
    unlock: <g><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></g>,
    checkCircle: <g><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></g>,
    clock: <g><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></g>,
    bookOpen: <g><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></g>,
    volume: <g><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></g>,
    users: <g><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
    messageSquare: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    briefcase: <g><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></g>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
};

/* ==========================================================================
   CARD 1: SKILL MASTERY DISTRIBUTION (INTERACTIVE DONUT / PIE CHART)
   ========================================================================== */
function SkillMasteryDistributionCard({ onViewBreakdown }) {
  const [activeSlice, setActiveSlice] = useState(null);

  const skillData = [
    { label: 'Clarity', score: 84, pct: 28, color: '#2563eb', desc: 'Precise messaging & logical flow' },
    { label: 'Confidence', score: 76, pct: 25, color: '#10b981', desc: 'Vocal projection & calm cadence' },
    { label: 'Structure', score: 68, pct: 24, color: '#f59e0b', desc: 'Adherence to STAR framework' },
    { label: 'Conciseness', score: 61, pct: 23, color: '#8b5cf6', desc: 'High signal-to-noise ratio' },
  ];

  const overallScore = 78;
  const radius = 52;
  const circumference = 2 * Math.PI * radius; // ≈ 326.72

  let accumulatedPercent = 0;
  const slices = skillData.map(item => {
    const strokeDasharray = `${(item.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.pct;
    return { ...item, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="metric-panel-card stagger-1">
      <div className="panel-header">
        <h3 className="panel-title blue-accent">Skill Mastery Distribution</h3>
        <span className="panel-badge badge-blue">Skill Proportions</span>
      </div>

      <div className="panel-content">
        <div className="pie-chart-wrap">
          <div className="pie-chart-svg-container" onMouseLeave={() => setActiveSlice(null)}>
            <svg viewBox="0 0 140 140" className="pie-chart-svg">
              {slices.map((slice, idx) => (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  stroke={slice.color}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="donut-slice"
                  style={{
                    strokeWidth: activeSlice?.label === slice.label ? 28 : 22,
                    opacity: activeSlice && activeSlice.label !== slice.label ? 0.55 : 1,
                  }}
                  onMouseEnter={() => setActiveSlice(slice)}
                />
              ))}
            </svg>
            <div className="donut-center-label">
              <span className="donut-center-val">
                {activeSlice ? `${activeSlice.score}` : `${overallScore} / 100`}
              </span>
              <span className="donut-center-sub">
                {activeSlice ? activeSlice.label : 'Overall Score'}
              </span>
            </div>
          </div>

          <div className="pie-legend-grid">
            {skillData.map(item => (
              <div
                key={item.label}
                className={`pie-legend-row ${activeSlice?.label === item.label ? 'active' : ''}`}
                onMouseEnter={() => setActiveSlice(item)}
                onMouseLeave={() => setActiveSlice(null)}
              >
                <div className="pie-legend-left">
                  <span className="pie-legend-dot" style={{ background: item.color }}/>
                  <span>{item.label}</span>
                </div>
                <span className="pie-legend-count">
                  {item.score} ({item.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Total Practice Sessions: <strong>24</strong></span>
        <button className="panel-action-link" onClick={onViewBreakdown}>
          View Breakdown <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   CARD 2: SPEECH GROWTH ANALYTICS (LINE CHART)
   ========================================================================== */
function SpeechGrowthAnalyticsCard({ onViewTrend }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = [
    { label: 'Jan', score: 54, x: 20, y: 92 },
    { label: 'Feb', score: 62, x: 100, y: 78 },
    { label: 'Mar', score: 69, x: 180, y: 64 },
    { label: 'Apr', score: 74, x: 260, y: 52 },
    { label: 'Jun', score: 78, x: 340, y: 38 },
  ];

  const pathD = `M 20 92 L 100 78 L 180 64 L 260 52 L 340 38`;
  const areaD = `M 20 92 L 100 78 L 180 64 L 260 52 L 340 38 L 340 120 L 20 120 Z`;

  return (
    <div className="metric-panel-card stagger-2">
      <div className="panel-header">
        <h3 className="panel-title">Speech Growth Analytics</h3>
        <span className="panel-badge badge-mint">Score Progression</span>
      </div>

      <div className="panel-content">
        <div style={{ position: 'relative' }} onMouseLeave={() => setHoveredPoint(null)}>
          <svg viewBox="0 0 360 125" className="line-chart-svg">
            <defs>
              <linearGradient id="mintAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            <line x1="20" y1="30" x2="340" y2="30" stroke="#f1f5f9" strokeDasharray="3 3"/>
            <line x1="20" y1="65" x2="340" y2="65" stroke="#f1f5f9" strokeDasharray="3 3"/>
            <line x1="20" y1="100" x2="340" y2="100" stroke="#f1f5f9" strokeDasharray="3 3"/>

            <path d={areaD} fill="url(#mintAreaGrad)"/>
            <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>

            {points.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.label === pt.label ? 6 : 4}
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  style={{ cursor: 'pointer', transition: 'r 0.15s' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#0f172a"
                >
                  {pt.score}
                </text>
                <text
                  x={pt.x}
                  y="120"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>

          {hoveredPoint && (
            <div className="line-tooltip" style={{ left: `${(hoveredPoint.x / 360) * 88}%`, top: '10px' }}>
              <strong>{hoveredPoint.label} Session</strong>: {hoveredPoint.score} pts
            </div>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Average Score Increase: <strong>+24 pts</strong></span>
        <button className="panel-action-link" onClick={onViewTrend}>
          View Trend <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   CARD 3: STAR STRUCTURE ADHERENCE (PIPELINE / STAGE BARS)
   ========================================================================== */
function StarStructureAdherenceCard({ onViewLogs }) {
  const [hoveredStage, setHoveredStage] = useState(null);

  const stages = [
    { 
      name: 'Situation', 
      stage: 'Stage 1', 
      pct: 100, 
      color: '#2563eb', 
      desc: 'Sets context within 20s', 
      tip: '100% Adherence: You cleanly establish context, team role, and stakes in under 20 seconds.' 
    },
    { 
      name: 'Task', 
      stage: 'Stage 2', 
      pct: 92, 
      color: '#3b82f6', 
      desc: 'Clarifies objective & ownership', 
      tip: '92% Adherence: High clarity defining personal responsibility and primary deliverables.' 
    },
    { 
      name: 'Action', 
      stage: 'Stage 3', 
      pct: 75, 
      color: '#60a5fa', 
      desc: 'Specific initiatives taken', 
      tip: '75% Adherence: Strong tactical explanation. Mention more cross-functional influence.' 
    },
    { 
      name: 'Result / Impact', 
      stage: 'Stage 4', 
      pct: 58, 
      color: '#93c5fd', 
      desc: 'Quantified outcomes delivered', 
      tip: '58% Adherence: Quantify metrics (e.g., % latency drop, $ revenue saved) earlier.' 
    },
  ];

  return (
    <div className="metric-panel-card stagger-3">
      <div className="panel-header">
        <h3 className="panel-title">STAR Structure Adherence</h3>
        <span className="panel-badge badge-blue">Answer Stages</span>
      </div>

      <div className="panel-content">
        <div className="star-pipeline-wrap">
          {stages.map((st, i) => (
            <div 
              key={i} 
              className={`star-stage-row ${hoveredStage?.name === st.name ? 'active-row' : ''}`}
              onMouseEnter={() => setHoveredStage(st)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <div className="star-stage-left">
                <span className="star-stage-title">{st.name}</span>
                <span className="star-stage-desc">{st.desc}</span>
              </div>
              <div className="star-stage-track-wrap">
                <div className="star-stage-track">
                  <div
                    className="star-stage-fill"
                    style={{
                      width: `${st.pct}%`,
                      background: st.color,
                    }}
                  />
                </div>
              </div>
              <div className="star-stage-right">
                <span className="star-stage-badge" style={{ color: st.color, background: `${st.color}15`, borderColor: `${st.color}35` }}>
                  {st.stage} • {st.pct}%
                </span>
              </div>
            </div>
          ))}

          {hoveredStage && (
            <div className="stage-tooltip-box">
              <Icon name="info" size={13} style={{ color: hoveredStage.color }}/>
              <span>{hoveredStage.tip}</span>
            </div>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Structured Answers: <strong>78%</strong></span>
        <button className="panel-action-link" onClick={onViewLogs}>
          View Structure Logs <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   CARD 4: VOICEPRINT COMPETENCY RADAR (5-DIMENSION RADAR)
   ========================================================================== */
function VoiceprintCompetencyRadarCard({ onViewCompetencies }) {
  const [hoveredDim, setHoveredDim] = useState(null);

  const competencies = [
    { label: 'Clarity', val: 84, tip: 'Clear pronunciation, crisp articulation, and zero muddled phrasing.' },
    { label: 'Confidence', val: 76, tip: 'Steady voice projection and low vocal hesitancy under pressure.' },
    { label: 'Story Structure', val: 68, tip: 'Logical sequence of problem, personal execution, and outcomes.' },
    { label: 'Conciseness', val: 61, tip: 'Elimination of conversational filler and repetitive clauses.' },
    { label: 'Vocabulary', val: 73, tip: 'Precise technical terminology and professional industry vernacular.' },
  ];

  const cx = 110;
  const cy = 82;
  const rMax = 56;
  const total = competencies.length;

  const getCoord = (index, value) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const dist = (value / 100) * rMax;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  const polyPoints = competencies.map((c, i) => {
    const pt = getCoord(i, c.val);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const getGridPoints = (levelPct) => {
    return Array.from({ length: total }).map((_, i) => {
      const pt = getCoord(i, levelPct);
      return `${pt.x},${pt.y}`;
    }).join(' ');
  };

  const getLabelCoord = (index) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const dist = rMax + 16;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  return (
    <div className="metric-panel-card stagger-4">
      <div className="panel-header">
        <h3 className="panel-title">Voiceprint Competency Radar</h3>
        <span className="panel-badge badge-blue">5 Dimensions</span>
      </div>

      <div className="panel-content">
        <div className="radar-card-layout">
          <div className="radar-svg-col">
            <svg viewBox="0 0 220 165" className="radar-svg-canvas">
              {[100, 75, 50, 25].map((lvl) => (
                <polygon
                  key={lvl}
                  points={getGridPoints(lvl)}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={lvl < 100 ? "2 2" : undefined}
                />
              ))}

              {Array.from({ length: total }).map((_, i) => {
                const outer = getCoord(i, 100);
                return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1"/>;
              })}

              <polygon
                points={polyPoints}
                fill="rgba(37, 99, 235, 0.18)"
                stroke="#2563eb"
                strokeWidth="2.2"
              />

              {competencies.map((c, i) => {
                const pt = getCoord(i, c.val);
                const lbl = getLabelCoord(i);
                const isHovered = hoveredDim?.label === c.label;
                return (
                  <g 
                    key={i} 
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredDim(c)}
                    onMouseLeave={() => setHoveredDim(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? "5" : "3.5"}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="2.2"
                    />
                    <text
                      x={lbl.x}
                      y={lbl.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9"
                      fontWeight={isHovered ? "700" : "600"}
                      fill={isHovered ? "#2563eb" : "#475569"}
                    >
                      {c.label} ({c.val}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="radar-pills-row">
            {competencies.map((c, idx) => (
              <div 
                key={idx} 
                className={`radar-dim-chip ${hoveredDim?.label === c.label ? 'active' : ''}`}
                onMouseEnter={() => setHoveredDim(c)}
                onMouseLeave={() => setHoveredDim(null)}
                title={c.tip}
              >
                <span className="dim-chip-dot" style={{ background: hoveredDim?.label === c.label ? '#2563eb' : '#94a3b8' }}/>
                <span className="dim-chip-name">{c.label}</span>
                <span className="dim-chip-val">{c.val}%</span>
              </div>
            ))}
          </div>

          {hoveredDim && (
            <div className="radar-hover-explanation">
              <strong>{hoveredDim.label} ({hoveredDim.val}%):</strong> {hoveredDim.tip}
            </div>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Dominant Dimension: <strong>Clarity (84%)</strong></span>
        <button className="panel-action-link" onClick={onViewCompetencies}>
          View Competencies <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   CARD 5: PACING & DELIVERY METRICS (VERTICAL COLUMN PILL BARS)
   ========================================================================== */
function PacingDeliveryMetricsCard({ onAnalyzeDelivery }) {
  const [hoveredMetric, setHoveredMetric] = useState(null);

  const metrics = [
    { 
      label: 'Pace (WPM)', 
      value: '135', 
      unit: 'WPM', 
      target: '130 - 150', 
      fillPct: 82, 
      color: '#059669', // Emerald
      status: 'Ideal',
      statusClass: 'status-emerald',
      tip: 'Optimal interview pacing is 130 - 150 words per minute for comprehension.' 
    },
    { 
      label: 'Pauses', 
      value: '12', 
      unit: 'pauses', 
      target: '8 - 14 / min', 
      fillPct: 65, 
      color: '#2563eb', // Royal Blue
      status: 'Cadenced',
      statusClass: 'status-blue',
      tip: 'Strategic 1-2s pauses allow recruiters to absorb key technical highlights.' 
    },
    { 
      label: 'Fillers / Min', 
      value: '2.4', 
      unit: 'per min', 
      target: '< 1.5 / min', 
      fillPct: 40, 
      color: '#d97706', // Amber
      status: 'Needs Work',
      statusClass: 'status-amber',
      tip: 'Detected occasional "um" and "like". Replace fillers with silent pauses.' 
    },
    { 
      label: 'Intonation', 
      value: '82%', 
      unit: 'variety', 
      target: '> 75%', 
      fillPct: 88, 
      color: '#7c3aed', // Purple
      status: 'Engaging',
      statusClass: 'status-purple',
      tip: 'High dynamic vocal variety avoids flat monotone delivery in long stories.' 
    },
  ];

  return (
    <div className="metric-panel-card stagger-5">
      <div className="panel-header">
        <h3 className="panel-title">Pacing &amp; Delivery Metrics</h3>
        <span className="panel-badge badge-blue">Acoustics</span>
      </div>

      <div className="panel-content">
        <div className="pacing-columns-wrapper">
          <div className="pacing-pillars-grid">
            {metrics.map((m, idx) => {
              const isHovered = hoveredMetric?.label === m.label;
              return (
                <div 
                  key={idx} 
                  className={`pacing-pillar-item ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredMetric(m)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  <div className="pillar-track-container">
                    <div className="pillar-target-indicator" title={m.target}/>
                    <div 
                      className="pillar-fill-bar" 
                      style={{ 
                        height: `${m.fillPct}%`, 
                        background: m.color 
                      }}
                    />
                    <span className="pillar-floating-val">{m.value}</span>
                  </div>

                  <span className={`pillar-status-chip ${m.statusClass}`}>
                    {m.status}
                  </span>

                  <div className="pillar-title-wrap">
                    <span className="pillar-main-name">{m.label}</span>
                    <span className="pillar-target-label">{m.target}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {hoveredMetric && (
            <div className="pacing-hover-tip">
              <Icon name="info" size={13} style={{ color: hoveredMetric.color }}/>
              <span><strong>{hoveredMetric.label}:</strong> {hoveredMetric.tip}</span>
            </div>
          )}
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Delivery Quality: <strong>Strong Cadence</strong></span>
        <button className="panel-action-link" onClick={onAnalyzeDelivery}>
          Analyze Delivery <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   CARD 6: INTERVIEW READINESS INDEX (SEMI-CIRCLE GAUGE)
   ========================================================================== */
function InterviewReadinessIndexCard({ onOpenRubric }) {
  const score = 82;
  const target = 85;
  const radius = 70;
  const arcLength = Math.PI * radius; // ≈ 219.9
  const fillOffset = arcLength * (1 - score / 100);

  return (
    <div className="metric-panel-card stagger-6">
      <div className="panel-header">
        <h3 className="panel-title">Interview Readiness Index</h3>
        <span className="panel-badge badge-blue">Composite</span>
      </div>

      <div className="panel-content">
        <div className="gauge-centered-container">
          <div className="gauge-arch-wrapper">
            <svg viewBox="0 0 200 115" className="gauge-svg-element">
              <path
                d="M 25 105 A 75 75 0 0 1 175 105"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="15"
                strokeLinecap="round"
              />
              <path
                d="M 25 105 A 75 75 0 0 1 175 105"
                fill="none"
                stroke="#2563eb"
                strokeWidth="15"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                strokeDashoffset={fillOffset}
              />
            </svg>

            <div className="gauge-inner-center-box">
              <span className="gauge-bold-score">{score}%</span>
              <span className="gauge-readiness-badge">Industry Ready</span>
            </div>
          </div>

          <div className="gauge-milestone-row">
            <span className="gauge-sub-target">Target: <strong>{target}% Benchmark</strong></span>
            <span className="gauge-gap-text">Gap: <strong>-3 pts</strong> to tier-1 corporate bar</span>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <span className="panel-footer-stat">Benchmark Target: <strong>{target}%</strong></span>
        <button className="panel-action-link" onClick={onOpenRubric}>
          Rubric Map <Icon name="arrowRight" size={13}/>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW: JOB PREP TAB (DEDICATED 2-TRACK PLACEMENT SUITE)
   ========================================================================== */
function JobPrepView({ onLaunchInterview, onLaunchGDRoom }) {
  const prepTracks = [
    {
      id: 'mock-interview',
      title: '1-on-1 AI Mock Interview',
      tag: 'Voice-First AI Interviewer',
      tagColor: '#2563eb',
      tagBg: '#eff6ff',
      icon: 'mic',
      duration: '15 Mins · 5 Questions',
      desc: 'Adaptive voice interviewer evaluating technical bottleneck resolution, system architecture, and STAR leadership delivery with live browser TTS speech and real-time rubric feedback.',
      metrics: ['STAR Structure', 'Speech Clarity', 'Filler Ratio', 'Delivery Pacing'],
      actionLabel: 'Launch 1-on-1 Interview →',
      actionHandler: onLaunchInterview,
    },
    {
      id: 'gd-simulator',
      title: 'Group Discussion (GD) Simulator',
      tag: 'Multi-Speaker Audio Simulation',
      tagColor: '#059669',
      tagBg: '#ecfdf5',
      icon: 'users',
      duration: '10 Mins · 3 AI Peers',
      desc: 'Step into an interactive campus placement GD room with Rohan, Priya, and Karthik debating aloud. Practice intervening cleanly during natural pauses, making constructive rebuttals, and yielding the floor.',
      metrics: ['Intervention Timing', 'Constructive Tone', 'Floor Share', 'Synthesis'],
      actionLabel: 'Enter Audio GD Room →',
      actionHandler: onLaunchGDRoom,
    },
  ];

  return (
    <div className="tab-view-container job-prep-page-container">
      {/* Page Header */}
      <div className="dashboard-subheader">
        <div className="subheader-title">
          <div className="job-prep-pill-badge" style={{ marginBottom: 6 }}>
            <Icon name="briefcase" size={13} style={{ color: '#746D62' }}/>
            <span>Campus Placement & Hiring Simulation Engine</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '4px 0 6px 0' }}>Job Prep Center</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            High-fidelity voice simulations designed for engineering placements, technical interviews, and group discussions.
          </p>
        </div>
      </div>

      {/* 2 Dedicated Cards Grid */}
      <div className="job-prep-two-cards-grid">
        {prepTracks.map((track) => (
          <div key={track.id} className="job-prep-hero-card">
            <div className="job-prep-card-top">
              <div className="job-prep-icon-box">
                <Icon name={track.icon} size={22}/>
              </div>
              <div className="job-prep-tags">
                <span className="job-prep-tag" style={{ color: track.tagColor, background: track.tagBg }}>
                  {track.tag}
                </span>
                <span className="job-prep-duration">{track.duration}</span>
              </div>
            </div>

            <h2 className="job-prep-card-title">{track.title}</h2>
            <p className="job-prep-card-desc">{track.desc}</p>

            <div className="job-prep-metrics-chips">
              <span className="metrics-label">Evaluation Rubric:</span>
              {track.metrics.map((m, i) => (
                <span key={i} className="metric-chip-mini">{m}</span>
              ))}
            </div>

            <div className="job-prep-card-footer">
              <button className="job-prep-cta-btn" onClick={track.actionHandler}>
                <span>{track.actionLabel}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 1: OVERVIEW TAB (STANDALONE 6-CARD 2x3 ANALYTICS GRID)
   ========================================================================== */
function OverviewView({ onNavigate }) {
  return (
    <div className="tab-view-container">
      {/* Page Title Bar */}
      <div className="dashboard-subheader">
        <div className="subheader-title">
          <h1>Communication Dashboard</h1>
          <p>Real-time Speech Analytics & Key Performance Metrics</p>
        </div>
      </div>

      {/* 2x3 Grid of 6 Analytics Cards (Voiceprint Data) */}
      <div className="dashboard-grid-3x2">
        <SkillMasteryDistributionCard onViewBreakdown={() => onNavigate('assessments')}/>
        <SpeechGrowthAnalyticsCard onViewTrend={() => onNavigate('progress')}/>
        <StarStructureAdherenceCard onViewLogs={() => onNavigate('reports')}/>
        <VoiceprintCompetencyRadarCard onViewCompetencies={() => onNavigate('coaching')}/>
        <PacingDeliveryMetricsCard onAnalyzeDelivery={() => onNavigate('assessments')}/>
        <InterviewReadinessIndexCard onOpenRubric={() => onNavigate('progress')}/>
      </div>
    </div>
  );
}

/* ==========================================================================
   SCENARIO DATA (EXACTLY 5 QUESTIONS PER TEST)
   ========================================================================== */
const scenarioData = {
  behavioral: {
    id: 'behavioral',
    title: 'Behavioral Interview',
    badge: 'STAR Framework',
    icon: 'spark',
    desc: 'Leadership, ownership, cross-team conflict resolution, and high-impact project execution.',
    questions: [
      {
        prompt: "Tell me about a time you faced a critical production incident or strategic disagreement. How did you align the team and deliver results?",
        guidance: "Use STAR: Situation, Task, Action, Result",
        transcript: "When our primary Redis cluster experienced silent memory eviction during peak checkout, our API latency spiked from 45ms to 4.2 seconds. Rather than assigning blame, I assembled our infra and backend leads to immediately switch read traffic to our secondary replica. We restored 99.9% uptime within 14 minutes, preventing an estimated $140K in checkout churn.",
        stats: { clarity: 86, fillers: 0, wpm: 136 }
      },
      {
        prompt: "Describe a high-stakes project where you had to lead with incomplete information or shifting requirements.",
        guidance: "Use STAR: Situation, Task, Action, Result",
        transcript: "During our Q3 enterprise compliance overhaul, regulatory specifications changed two weeks prior to audit freeze. I established a daily 15-minute triage with engineering and legal to de-scope secondary audit requirements. We delivered 100% of critical SOC-2 Type II controls ahead of schedule.",
        stats: { clarity: 84, fillers: 1, wpm: 138 }
      },
      {
        prompt: "Tell me about a project where you failed or missed a major deadline. How did you manage expectations and recover?",
        guidance: "Use STAR: Situation, Task, Action, Result",
        transcript: "When building our OAuth2 single sign-on provider, third-party identity sync took twice as long as estimated, threatening our quarterly release. I immediately notified our executive sponsor with a revised 2-sprint delivery roadmap and delivered a phased rollout starting with internal users first, ultimately landing 100% of enterprise tenants with zero security flaws.",
        stats: { clarity: 82, fillers: 1, wpm: 132 }
      },
      {
        prompt: "Give an example of how you influenced a skeptical cross-functional stakeholder to adopt your technical roadmap.",
        guidance: "Use STAR: Situation, Task, Action, Result",
        transcript: "Our product VP initially pushed back on rewriting our legacy monolith data layer due to sprint deadlines. I built an interactive prototype demonstrating how a partitioned database would eliminate 60% of customer support ticket lag. After reviewing customer impact metrics, they approved the dedicated 2-sprint migration.",
        stats: { clarity: 88, fillers: 0, wpm: 140 }
      },
      {
        prompt: "How do you prioritize competing requests from multiple high-value stakeholders when resources are severely constrained?",
        guidance: "Use STAR: Situation, Task, Action, Result",
        transcript: "When marketing, sales, and security simultaneously requested urgent Q4 deliverables, our team only had capacity for two. I established an objective scoring matrix based on customer retention and revenue vulnerability, shared the rubric transparently with all three stakeholders, and aligned everyone on security compliance and self-service onboarding first.",
        stats: { clarity: 85, fillers: 0, wpm: 135 }
      }
    ]
  },
  technical: {
    id: 'technical',
    title: 'Technical Interview',
    badge: 'System Design & Tradeoffs',
    icon: 'grid',
    desc: 'Explain trade-offs, scaling bottlenecks, distributed queues, and architectural decisions.',
    questions: [
      {
        prompt: "How would you design a distributed rate limiter that handles millions of requests across multiple global regions?",
        guidance: "Structure: Requirements → High-Level Architecture → Concurrency → Trade-offs",
        transcript: "I would implement a Token Bucket algorithm backed by Redis clusters deployed in each regional VPC. To avoid global synchronization latency, we use local rate limiting with periodic batch reconciliation via Kafka, trading off strict global precision for sub-millisecond local enforcement.",
        stats: { clarity: 87, fillers: 0, wpm: 142 }
      },
      {
        prompt: "Describe a complex performance bottleneck you diagnosed and resolved in a production system.",
        guidance: "Structure: Diagnostic Methodology → Root Cause → Resolution → Verification",
        transcript: "We observed p99 latency spikes in our payment processing pipeline. Using distributed tracing in Datadog, I traced the issue to unindexed foreign key lookups triggering full table scans during heavy write locks. Adding composite indexes and introducing a write-through read replica reduced p99 latency from 2.8s to 110ms.",
        stats: { clarity: 85, fillers: 1, wpm: 139 }
      },
      {
        prompt: "Walk me through how you choose between a relational database and a NoSQL document store for high-throughput workloads.",
        guidance: "Structure: Data Model → Access Patterns → Consistency Guarantees → Cost & Scale",
        transcript: "The choice fundamentally hinges on query access patterns and transaction guarantees. For structured financial ledgers requiring strict ACID transactions and relational joins, PostgreSQL is our choice. For semi-structured telemetry with high write throughput and horizontal partitioning, DynamoDB or MongoDB is far superior.",
        stats: { clarity: 84, fillers: 0, wpm: 135 }
      },
      {
        prompt: "How do you ensure zero-downtime database schema migrations in a high-traffic microservices architecture?",
        guidance: "Structure: Expand & Contract Pattern → Backward Compatibility → Phased Deploy",
        transcript: "We follow the Expand and Contract pattern across three deploy phases. First, expand the schema with nullable columns while maintaining backward compatibility. Second, update application code to write to both old and new columns. Finally, backfill historical data and contract the schema by deprecating the legacy columns.",
        stats: { clarity: 89, fillers: 0, wpm: 138 }
      },
      {
        prompt: "Explain how you handle data consistency and idempotency across asynchronous event-driven pipelines.",
        guidance: "Structure: Idempotency Keys → Deduplication → Outbox Pattern → Dead Letter Queues",
        transcript: "We enforce idempotency at the consumer boundary using unique UUID idempotency keys stored in an atomic Redis cache with a 24-hour TTL. On the producer side, we utilize the Transactional Outbox pattern with Debezium CDC to ensure events are published only when local transactions succeed.",
        stats: { clarity: 86, fillers: 0, wpm: 140 }
      }
    ]
  },
  executive: {
    id: 'executive',
    title: 'Executive Update',
    badge: 'Bottom-Line First',
    icon: 'trend',
    desc: 'High-stakes stakeholder briefings, roadmap risk mitigation, and executive KPI reporting.',
    questions: [
      {
        prompt: "Give an executive summary of our technical progress and risk posture for this quarter in under two minutes.",
        guidance: "Rule: Bottom-line first, followed by quantified achievements and top risk mitigation",
        transcript: "This quarter we delivered our core enterprise SSO integration two weeks ahead of schedule, unlocking $420K in pipeline ARR. Our primary operational risk remains third-party API rate limits during Black Friday, which we have mitigated by adding Redis edge caching with 99.9% uptime SLA.",
        stats: { clarity: 90, fillers: 0, wpm: 136 }
      },
      {
        prompt: "How would you present a critical project delay of three weeks to executive leadership and the board?",
        guidance: "Rule: State delay directly, outline root cause concisely, and present the recovery plan",
        transcript: "We are adjusting our general availability launch by three weeks to November 18. During stress testing, we identified a security regression in third-party auth that could jeopardize SOC-2 compliance. Rather than risking customer data, we reallocated four senior engineers to close the vulnerability.",
        stats: { clarity: 88, fillers: 0, wpm: 134 }
      },
      {
        prompt: "A key cloud vendor is doubling infrastructure pricing next month. Pitch your renegotiation or migration strategy to the CFO.",
        guidance: "Rule: State financial delta, present 2 viable options, and recommend the highest ROI path",
        transcript: "AWS has notified us of a $120K annual compute increase starting next month. We have two options: absorb the cost or migrate container workloads to Kubernetes spot instances. I recommend spot migration: an initial two-week effort will cut our annual cloud bill by 38%, saving $190K net.",
        stats: { clarity: 89, fillers: 0, wpm: 137 }
      },
      {
        prompt: "How do you report the ROI and operational efficiency gains of our recently deployed AI engineering initiatives?",
        guidance: "Rule: Translate developer hours saved into monetary efficiency and cycle time reduction",
        transcript: "Our AI code assistance rollout across 80 engineers has yielded a 22% reduction in pull request review cycle time. This translates to approximately 14 hours saved per engineer per month, delivering an annualized productivity dividend of $480K against an initial tool cost of $35K.",
        stats: { clarity: 91, fillers: 0, wpm: 135 }
      },
      {
        prompt: "Pitch the business case for investing two full engineering quarters into refactoring our legacy core platform.",
        guidance: "Rule: Tie technical debt directly to lost customer revenue and security risk",
        transcript: "Our legacy monolith currently accounts for 45% of customer support escalations and costs us $300K annually in emergency patch work. Dedicating Q1 and Q2 to modularizing the data layer will increase feature velocity by 3x and eliminate our single greatest availability risk.",
        stats: { clarity: 87, fillers: 0, wpm: 138 }
      }
    ]
  },
  difficult: {
    id: 'difficult',
    title: 'Difficult Conversation',
    badge: 'Negotiation & Empathy',
    icon: 'mic',
    desc: 'Constructive underperformance feedback, scope misalignment, and client contract pushback.',
    questions: [
      {
        prompt: "How would you deliver constructive feedback to a senior engineer whose code quality and collaboration have deteriorated?",
        guidance: "Approach: Direct observations without judgment, empathetic inquiry, and mutual commitment",
        transcript: "Alex, over the past three sprints, I noticed four pull requests merged with missing test suites, which caused two production hotfixes. You've consistently been our highest-quality architect, so I wanted to check in directly: what's getting in your way, and how can we support you?",
        stats: { clarity: 86, fillers: 0, wpm: 128 }
      },
      {
        prompt: "A major enterprise client demands a bespoke feature that violates your product roadmap. How do you push back?",
        guidance: "Approach: Validate business need, explain roadmap trade-offs, offer viable standard alternatives",
        transcript: "We understand how critical automated PDF exports are for your compliance audits. However, building custom legacy exporters would delay our upcoming public API by two months. Instead, we can provide immediate webhooks and a pre-built Zapier integration that fulfills your audit needs tomorrow.",
        stats: { clarity: 88, fillers: 1, wpm: 130 }
      },
      {
        prompt: "Address a fellow team lead who frequently interrupts and speaks over junior colleagues during architecture reviews.",
        guidance: "Approach: Private 1-on-1, specific recent example, team culture impact, and collaborative pivot",
        transcript: "Marcus, in yesterday's API review, I noticed Maya was cut off twice while presenting her database schema. She brought valuable distributed caching insights that we nearly missed. Let's make sure our review norms give junior engineers the floor to finish their rationale.",
        stats: { clarity: 87, fillers: 0, wpm: 126 }
      },
      {
        prompt: "How do you communicate a difficult budget reduction or team reorganization to your direct reports?",
        guidance: "Approach: Transparency, clear context, direct impact on priorities, and focus on stability",
        transcript: "Our company is reallocating resources to accelerate path-to-profitability, which means our tooling budget is reduced by 15% and we are pausing external hiring. Our team structure and individual roles remain 100% secure. Here is exactly what we are de-scoping to keep our workload balanced.",
        stats: { clarity: 85, fillers: 0, wpm: 129 }
      },
      {
        prompt: "Manage a client stakeholder who continually adds out-of-scope requests while insisting on the fixed launch date.",
        guidance: "Approach: Acknowledge value of requests, present the project iron triangle, request prioritization",
        transcript: "We would love to include multi-tenant SSO and custom reporting in this release. To guarantee our October 1st launch with zero bugs, we can either trade off the custom reporting module or move SSO to Phase 2. Which of those two best protects your launch milestones?",
        stats: { clarity: 89, fillers: 0, wpm: 133 }
      }
    ]
  }
};

/* ==========================================================================
   ASSESSMENT MODAL POP-UP (CLEAN, MINIMAL & DISTRACTION-FREE)
   ========================================================================== */
function AssessmentModal({ scenario, onClose, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle' | 'recording' | 'finished'
  const [timer, setTimer] = useState(0);

  const questions = scenario.questions || [];
  const currentQ = questions[currentQuestionIndex] || questions[0];

  // Timer effect: counts up as soon as recording begins
  React.useEffect(() => {
    let interval = null;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setRecordingState('idle');
      setTimer(0);
    } else {
      onComplete();
    }
  };

  const handleReRecord = () => {
    setRecordingState('idle');
    setTimer(0);
  };

  return (
    <div className="assessment-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="assessment-modal-box">
        {/* Top Bar */}
        <div className="modal-top-bar">
          <div className="modal-top-left">
            <span className="modal-scenario-badge">{scenario.title}</span>
            <span className="modal-progress-text">Question {currentQuestionIndex + 1} of 5</span>
          </div>

          <div className="modal-top-right">
            {/* Live Timer */}
            <span className={`modal-live-timer ${recordingState === 'recording' ? 'recording' : ''}`}>
              {recordingState === 'recording' && <span className="timer-pulse-dot"/>}
              {recordingState === 'finished' ? `⏱ ${formatTime(timer)}` : formatTime(timer)}
            </span>

            {/* Exit button */}
            <button className="modal-close-btn" onClick={onClose} title="Exit Assessment">
              ✕
            </button>
          </div>
        </div>

        {/* Step Progress Line */}
        <div className="modal-progress-bar-track">
          <div
            className="modal-progress-bar-fill"
            style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="modal-question-wrap">
          <h2 className="modal-question-title">"{currentQ.prompt}"</h2>
          <p className="modal-question-subtext">{currentQ.guidance}</p>
        </div>

        {/* Central Recording Control */}
        <div className="modal-recording-hub">
          {recordingState === 'idle' && (
            <>
              <button
                className="modal-mic-btn"
                onClick={() => {
                  setRecordingState('recording');
                  setTimer(0);
                }}
                title="Start Recording Response"
              >
                <Icon name="mic" size={30}/>
              </button>
              <div className="modal-mic-label">Tap to Record</div>
              <div className="modal-mic-subtext">Click the microphone when ready. Speak naturally at your normal pace.</div>
            </>
          )}

          {recordingState === 'recording' && (
            <>
              <button
                className="modal-mic-btn recording"
                onClick={() => setRecordingState('finished')}
                title="Finish Recording Response"
              >
                <Icon name="stop" size={26}/>
              </button>
              <div className="modal-mic-label recording">Finish Recording</div>
              <div className="modal-mic-subtext">Listening &amp; tracking acoustic signals… Click button when finished.</div>

              {/* Animated Waveform Display during recording */}
              <div className="modal-waveform-wrap recording">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="modal-waveform-bar"
                    style={{ animationDelay: `${(i % 6) * 0.12}s` }}
                  />
                ))}
              </div>
            </>
          )}

          {recordingState === 'finished' && (
            <>
              <div
                className="modal-mic-btn"
                style={{ background: '#10b981', boxShadow: '0 8px 22px rgba(16, 185, 129, 0.35)', cursor: 'default' }}
              >
                <Icon name="check" size={32}/>
              </div>
              <div className="modal-mic-label" style={{ color: '#10b981' }}>Answer Captured</div>
              <div className="modal-mic-subtext">Duration: <strong>{formatTime(timer)}</strong> · Speech evaluation generated below.</div>
            </>
          )}
        </div>

        {/* Revealed Transcript Card (Strictly ONLY shown after recording finishes) */}
        {recordingState === 'finished' && (
          <div className="modal-transcript-card">
            <div className="modal-transcript-header">
              <span className="modal-transcript-title">RECORDED TRANSCRIPT &amp; SPEECH TELEMETRY</span>
              <div className="modal-transcript-stats">
                <span className="stat-pill-sm green">{currentQ.stats.clarity}% Clarity</span>
                <span className="stat-pill-sm blue">{currentQ.stats.fillers} Fillers</span>
                <span className="stat-pill-sm">{currentQ.stats.wpm} WPM</span>
              </div>
            </div>

            <div className="modal-transcript-body">
              <span className="transcript-annotation">Situation</span>
              {currentQ.transcript.split('. ')[0]}.{' '}
              <span className="transcript-annotation">Action &amp; Result</span>
              {currentQ.transcript.split('. ').slice(1).join('. ')}
            </div>
          </div>
        )}

        {/* Navigation Row */}
        <div className="modal-footer-nav">
          <div>
            {recordingState === 'finished' && (
              <button className="btn-secondary" onClick={handleReRecord}>
                <Icon name="refresh" size={13}/> Re-record Answer
              </button>
            )}
          </div>

          <div>
            {recordingState === 'finished' ? (
              currentQuestionIndex < 4 ? (
                <button className="btn-primary" onClick={handleNextQuestion}>
                  Next Question <Icon name="arrowRight" size={14}/>
                </button>
              ) : (
                <button className="btn-primary success" onClick={onComplete}>
                  <Icon name="check" size={14}/> Complete Assessment
                </button>
              )
            ) : (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {recordingState === 'recording' ? 'Speak clearly into your microphone' : 'Tap mic to start question'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 2: ASSESSMENTS TAB (CLEAN & DISTRACTION-FREE SCENARIO PICKER)
   ========================================================================== */
function AssessmentsView({ onSelectScenario }) {
  const scenarioList = Object.values(scenarioData);

  return (
    <div className="tab-view-container">
      {/* Subheader */}
      <div className="dashboard-subheader">
        <div className="subheader-title">
          <h1>Practice &amp; Assessment Studio</h1>
          <p>Choose an interview track to start your 5-question targeted voice simulation</p>
        </div>

        <div className="subheader-controls">
          <span className="panel-badge badge-blue">Fixed Length: 5 Questions / Test</span>
        </div>
      </div>

      {/* Clean Scenario Selection Cards Grid (ONLY scenario cards shown) */}
      <div className="section-card">
        <div className="section-title-row">
          <div>
            <h2 className="section-title">
              <Icon name="layers" size={18} style={{ color: '#2563eb' }}/>
              Select Interview Scenario
            </h2>
            <p className="section-desc">Click any track to launch an interactive 5-question coaching session.</p>
          </div>
        </div>

        <div className="scenario-grid">
          {scenarioList.map((sc) => (
            <div
              key={sc.id}
              className="scenario-card"
              onClick={() => onSelectScenario(sc)}
            >
              <div className="scenario-top">
                <div className="scenario-icon-box">
                  <Icon name={sc.icon} size={20}/>
                </div>
                <span className="scenario-badge">{sc.badge}</span>
              </div>
              <h4 className="scenario-name">{sc.title}</h4>
              <p className="scenario-desc">{sc.desc}</p>
              <div className="scenario-footer">
                <span>5 Questions</span>
                <span className="scenario-action-cta">
                  Start Practice <Icon name="arrowRight" size={11}/>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 3: COACHING TAB (COACHING PLAN & ROADMAP)
   ========================================================================== */
/* ==========================================================================
   ASSESSMENT-DRIVEN DYNAMIC ROADMAP DATA STRUCTURE & E-LEARNING TRAJECTORY
   ========================================================================== */

/**
 * @typedef {Object} RoadmapStep
 * @property {number} id
 * @property {'conciseness' | 'structure' | 'confidence' | 'clarity'} metricKey
 * @property {string} title
 * @property {string} tagline
 * @property {string} diagnosticNote
 * @property {'completed' | 'in-progress' | 'locked'} status
 * @property {number} estimatedMinutes
 * @property {{ overview: string, actionableSteps: string[], exampleScript: { before: string, after: string } }} learningGuide
 */

export const initialRoadmapData = [
  {
    id: 1,
    metricKey: 'conciseness',
    title: 'Get Straight to the Point',
    tagline: 'Share your main result in the first 15 seconds',
    diagnosticNote: 'You spent 58 seconds giving backstory before sharing the main result.',
    status: 'in-progress',
    estimatedMinutes: 8,
    learningGuide: {
      overview: 'People pay attention to big results first. Turn your story around: share your main win right away, then explain how you made it happen.',
      actionableSteps: [
        'Pick your single biggest win (like: "cut loading time by 35%" or "saved $40,000").',
        'Say that main win in your very first sentence before diving into details.',
        'Keep your opening under 15 seconds so you keep everyone hooked.'
      ],
      exampleScript: {
        before: 'In my last role we had so many meetings about our server queue crashing, and after days of debugging and talking to everyone...',
        after: 'I rebuilt our background pipeline, reducing transaction errors from 40% down to 3% in just three weeks.'
      }
    }
  },
  {
    id: 2,
    metricKey: 'structure',
    title: 'Show Your Impact & Results',
    tagline: 'Spend more time on what YOU did and the final outcome',
    diagnosticNote: 'Only 12% of your speaking time was spent explaining the final outcome.',
    status: 'locked',
    estimatedMinutes: 12,
    learningGuide: {
      overview: 'A good story should always have a strong finish. Spend half of your time explaining the exact actions you took, and finish strong with clear results.',
      actionableSteps: [
        'Spend half of your answer explaining the specific steps YOU personally took.',
        'End with concrete numbers or facts (like hours saved, money earned, or zero downtime).',
        'Finish with one key lesson or skill you learned from the experience.'
      ],
      exampleScript: {
        before: '...and so after we wrapped that up, the database was basically working fine again.',
        after: '...which gave us 100% uptime during Black Friday traffic and saved our engineering team 14 hours every sprint.'
      }
    }
  },
  {
    id: 3,
    metricKey: 'confidence',
    title: 'Pause Confidently (No "Um"s)',
    tagline: 'Replace filler words with calm 2-second silent pauses',
    diagnosticNote: 'You used 2.4 filler words ("um", "like") per minute during tricky answers.',
    status: 'locked',
    estimatedMinutes: 10,
    learningGuide: {
      overview: 'Silence feels scary, but a calm pause actually makes you sound thoughtful and confident. Filler words like "um" and "like" happen when your mouth speaks before your brain is ready.',
      actionableSteps: [
        'Take a quiet, calm breath whenever you finish a thought instead of filling the silence.',
        'Silently count "one, two" in your head before answering tricky questions.',
        'Speak at a steady, relaxed conversational speed without rushing.'
      ],
      exampleScript: {
        before: 'Um, basically what we decided to do was, like, shard the database collection because, you know...',
        after: '[Short Pause] We evaluated two paths: splitting the collection or optimizing indexes. We chose indexing.'
      }
    }
  },
  {
    id: 4,
    metricKey: 'clarity',
    title: 'Explain Ideas in Plain English',
    tagline: 'Give the big picture first before getting into technical details',
    diagnosticNote: 'Your technical clarity is good (84/100); now practice explaining it simply to anyone.',
    status: 'locked',
    estimatedMinutes: 15,
    learningGuide: {
      overview: 'The best communicators can explain technical ideas so simply that anyone in the room can easily understand the business value.',
      actionableSteps: [
        'Use an everyday comparison or analogy to explain complex parts.',
        'Explain the business reason first, then explain the technical solution.',
        'Finish with a simple one-sentence takeaway that anyone can remember.'
      ],
      exampleScript: {
        before: 'We put an asynchronous broker queue in the middle so worker threads could poll tasks during idle cycles.',
        after: 'We separated receiving orders from processing them, which stopped the system from slowing down during peak hours.'
      }
    }
  }
];

export const METRIC_CONFIG = {
  conciseness: {
    label: 'Be Direct',
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    border: '#ddd6fe',
    badgeClass: 'badge-purple',
    icon: 'spark',
    drillScenario: 'executive',
    subTitle: 'Get straight to the point'
  },
  structure: {
    label: 'Tell the Story',
    color: '#f59e0b',
    bgLight: '#fffbeb',
    border: '#fde68a',
    badgeClass: 'badge-amber',
    icon: 'layers',
    drillScenario: 'technical',
    subTitle: 'Your actions & the big finish'
  },
  confidence: {
    label: 'Calm Pauses',
    color: '#10b981',
    bgLight: '#ecfdf5',
    border: '#a7f3d0',
    badgeClass: 'badge-emerald',
    icon: 'mic',
    drillScenario: 'difficult',
    subTitle: 'Replace "um" with silence'
  },
  clarity: {
    label: 'Plain English',
    color: '#2563eb',
    bgLight: '#eff6ff',
    border: '#bfdbfe',
    badgeClass: 'badge-blue',
    icon: 'award',
    drillScenario: 'behavioral',
    subTitle: 'Explain simply to anyone'
  }
};

export function generateRoadmapFromAssessment(assessmentMetrics = { conciseness: 61, structure: 68, confidence: 76, clarity: 84 }) {
  return initialRoadmapData.map((step) => {
    const score = assessmentMetrics[step.metricKey] ?? 70;
    let dynamicNote = step.diagnosticNote;
    if (step.metricKey === 'conciseness') {
      dynamicNote = `You spent 58 seconds giving backstory before sharing the main result (Score: ${score}/100).`;
    } else if (step.metricKey === 'structure') {
      dynamicNote = `Only 12% of your speaking time was spent sharing the final outcome (Score: ${score}/100).`;
    } else if (step.metricKey === 'confidence') {
      dynamicNote = `You used 2.4 filler words ("um", "like") per minute during tricky answers (Score: ${score}/100).`;
    } else if (step.metricKey === 'clarity') {
      dynamicNote = `Your clarity is good (${score}/100); now practice explaining it simply to anyone.`;
    }
    return {
      ...step,
      diagnosticNote: dynamicNote,
      score: score
    };
  });
}

/* ==========================================================================
   COMPONENT: STEP-BY-STEP LEARNING DRAWER
   ========================================================================== */
function StepLearningDrawer({
  step,
  isOpen,
  onClose,
  isFinished,
  onToggleFinished,
  checkedSteps,
  onToggleStepCheck,
  onLaunchDrill,
  scenarioData
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioTimer((prev) => {
          if (prev >= 8) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setAudioTimer(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  if (!isOpen || !step) return null;

  const config = METRIC_CONFIG[step.metricKey] || METRIC_CONFIG.conciseness;
  const currentStepChecks = checkedSteps[step.id] || {};
  const actionableSteps = step.learningGuide?.actionableSteps || [];
  const checkedCount = actionableSteps.filter((_, i) => currentStepChecks[i]).length;
  const progressPct = actionableSteps.length > 0 ? Math.round((checkedCount / actionableSteps.length) * 100) : 0;

  return (
    <div className="learning-drawer-backdrop" onClick={onClose}>
      <div className="learning-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-meta-badges">
              <span className="card-metric-pill" style={{ color: config.color, background: config.bgLight, borderColor: config.border }}>
                <Icon name={config.icon} size={13} /> {config.label} · {step.score || 70} pts
              </span>
              <span className={`card-status-pill ${step.status}`}>
                {step.status === 'completed' ? 'Completed ✓' : step.status === 'in-progress' ? 'Current Practice' : 'Locked'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                <Icon name="clock" size={12} style={{ verticalAlign: '-1px' }} /> {step.estimatedMinutes} min guide
              </span>
            </div>
            <h3 className={`drawer-title ${isFinished ? 'struck-off' : ''}`}>
              Practice 0{step.id}: {step.title}
            </h3>
            <p className={`drawer-tagline ${isFinished ? 'struck-off' : ''}`}>
              {step.tagline}
            </p>
          </div>
          <button className="btn-drawer-close" onClick={onClose} aria-label="Close guide">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Strike Off Quick Action Bar */}
        <div className="drawer-strike-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              Practice Status:
            </span>
            <span className={`card-status-pill ${isFinished ? 'completed' : 'in-progress'}`}>
              {isFinished ? 'Completed ✓' : 'In Progress'}
            </span>
          </div>

          <button
            className={`drawer-strike-btn ${isFinished ? 'finished' : 'unfinished'}`}
            onClick={() => onToggleFinished(step.id)}
          >
            <Icon name={isFinished ? 'checkCircle' : 'check'} size={16} />
            {isFinished ? 'Completed ✓ (Click to Reopen)' : 'Mark Practice as Done ✓'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="drawer-body-scroll">
          {/* Diagnostic Assessment Finding Callout */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <Icon name="mic" size={14} style={{ color: '#6366f1' }} />
              🎯 What Your Voice Test Found
            </div>
            <div className="drawer-diagnostic-alert">
              <div className="diagnostic-alert-icon">
                <Icon name="mic" size={16} />
              </div>
              <div className="diagnostic-alert-body">
                <h5>Why you're practicing this:</h5>
                <p>"{step.diagnosticNote}"</p>
              </div>
            </div>
          </div>

          {/* Strategic Overview */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <Icon name="spark" size={14} style={{ color: config.color }} />
              💡 The Golden Rule
            </div>
            <div className="drawer-overview-text">
              {step.learningGuide?.overview}
            </div>
          </div>

          {/* Actionable Steps Checklist */}
          <div className="drawer-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="drawer-section-title">
                <Icon name="layers" size={14} style={{ color: '#0f172a' }} />
                ✅ Easy Steps to Practice
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                {checkedCount} of {actionableSteps.length} Steps Done ({progressPct}%)
              </span>
            </div>

            <div className="actionable-steps-list">
              {actionableSteps.map((stepText, idx) => {
                const isChecked = !!currentStepChecks[idx];
                return (
                  <div
                    key={idx}
                    className={`actionable-step-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => onToggleStepCheck(step.id, idx)}
                  >
                    <div className="step-checkbox">
                      {isChecked && <Icon name="check" size={14} stroke={2.5} />}
                    </div>
                    <div className="step-instruction-text">
                      <span style={{ fontWeight: 600, color: isChecked ? '#166534' : '#0f172a', marginRight: '6px' }}>
                        Step 0{idx + 1}:
                      </span>
                      {stepText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Before vs. After Script Comparison */}
          <div className="drawer-section">
            <div className="drawer-section-title">
              <Icon name="fileText" size={14} style={{ color: '#2563eb' }} />
              📝 Real Example: Before vs. After
            </div>

            <div className="script-comparison-grid">
              <div className="script-box before">
                <div className="script-box-header">
                  <span>⚠️ Before (Hard to Follow / Too Much Backstory)</span>
                  <span>Before Practice</span>
                </div>
                <p className="script-text">
                  "{step.learningGuide?.exampleScript?.before}"
                </p>
              </div>

              <div className="script-box after">
                <div className="script-box-header">
                  <span>⚡ After (Quick, Strong &amp; Confident)</span>
                  <span>Clear Example</span>
                </div>
                <p className="script-text">
                  "{step.learningGuide?.exampleScript?.after}"
                </p>
              </div>
            </div>

            {/* Audio Simulation Box */}
            <div className="audio-simulation-card">
              <div className="audio-sim-info">
                <button
                  className="btn-audio-sim-toggle"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  title={isPlayingAudio ? 'Pause audio' : 'Listen to example audio'}
                >
                  <Icon name={isPlayingAudio ? 'stop' : 'play'} size={16} />
                </button>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {isPlayingAudio ? 'Playing Example Audio...' : 'Listen to an Example'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {isPlayingAudio ? `Pacing: 140 words/min (0:0${audioTimer} / 0:08)` : 'Hear how a calm, clear answer sounds'}
                  </div>
                </div>
              </div>

              <div className="audio-sim-waves">
                {[12, 20, 8, 16, 24, 14, 18, 10, 22, 12].map((h, i) => (
                  <div
                    key={i}
                    className={`audio-wave-bar ${isPlayingAudio ? 'playing' : ''}`}
                    style={{
                      height: isPlayingAudio ? `${h}px` : '4px',
                      animationDelay: `${i * 0.08}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <button
            className={`btn-strike-toggle ${isFinished ? 'finished' : 'unfinished'}`}
            onClick={() => onToggleFinished(step.id)}
          >
            <Icon name={isFinished ? 'checkCircle' : 'check'} size={14} />
            {isFinished ? 'Completed ✓' : 'Mark Practice as Done ✓'}
          </button>

          <button
            className="btn-primary"
            onClick={() => (onLaunchDrill ? onLaunchDrill(scenarioData[config.drillScenario]) : onClose())}
          >
            <Icon name="mic" size={14} /> 🎤 Try Practice Drill
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   COMPONENT: SERPENTINE ROADMAP INFOGRAPHIC
   ========================================================================== */
function SerpentineRoadmap({
  steps,
  assessmentMetrics,
  onOpenDrawer,
  onToggleFinish,
  onLaunchDrill,
  onNavigate,
  scenarioData,
  onRecalibrate
}) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="serpentine-roadmap-wrapper">
      {/* 1. Header Trajectory Summary & Progress Bar */}
      <div className="serpentine-trajectory-card">
        <div className="trajectory-top-row">
          <div className="trajectory-title-area">
            <h2>Your Step-by-Step Practice Path</h2>
            <p>Easy milestone exercises tailored to your voice test results</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="trajectory-stats-pill">
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                {completedCount} of {steps.length} Practices Completed
              </span>
              <span className="panel-badge badge-blue">{progressPercent}% Completed</span>
            </div>

            <button
              className="btn-secondary"
              onClick={() => onRecalibrate()}
              title="Update practice path from latest voice test"
              style={{ padding: '7px 12px', fontSize: '12px' }}
            >
              <Icon name="refresh" size={13} /> Update from Test
            </button>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="trajectory-progress-outer">
          <div
            className="trajectory-progress-inner"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>

        {/* Assessment Diagnostic Results Strip */}
        <div className="diagnostic-assessment-strip">
          <div className="diagnostic-strip-title">
            <span>Your Voice Test Scores (What shaped your path)</span>
            <span style={{ color: '#2563eb' }}>Click any practice below to open its learning guide</span>
          </div>

          <div className="diagnostic-chips-row">
            {steps.map((step) => {
              const cfg = METRIC_CONFIG[step.metricKey] || METRIC_CONFIG.conciseness;
              const score = assessmentMetrics[step.metricKey] ?? step.score;
              return (
                <div
                  key={step.metricKey}
                  className="diagnostic-metric-chip"
                  style={{ borderLeft: `3px solid ${cfg.color}` }}
                >
                  <div className="diagnostic-chip-left">
                    <span className="diagnostic-chip-name" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="diagnostic-chip-sub">
                      {step.status === 'completed' ? 'Completed ✓' : step.status === 'in-progress' ? 'Current Focus' : 'Up Next'}
                    </span>
                  </div>
                  <div className="diagnostic-chip-score" style={{ color: cfg.color }}>
                    {score}<span style={{ fontSize: '10px', color: '#94a3b8' }}>/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Serpentine Path Canvas */}
      <div className="serpentine-canvas">
        <div className="serpentine-track">
          {steps.map((step, idx) => {
            const isLeft = idx % 2 === 0;
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in-progress';
            const isLocked = step.status === 'locked';
            const cfg = METRIC_CONFIG[step.metricKey] || METRIC_CONFIG.conciseness;
            const nextStep = steps[idx + 1];
            const nextCfg = nextStep ? METRIC_CONFIG[nextStep.metricKey] || METRIC_CONFIG.conciseness : null;

            return (
              <React.Fragment key={step.id}>
                {/* Milestone Row */}
                <div className={`serpentine-milestone-row ${isLeft ? 'left-aligned' : 'right-aligned'}`}>
                  <div className="milestone-station-wrapper">
                    {/* Station Beacon Token */}
                    <div
                      className={`station-beacon ${step.status}`}
                      style={{ color: cfg.color }}
                      onClick={() => onOpenDrawer(step.id)}
                      title={`Practice 0${step.id}: ${step.title} (${step.status})`}
                    >
                      <span className="beacon-number">0{step.id}</span>
                      <div className="beacon-icon">
                        {isCompleted && <Icon name="check" size={20} stroke={2.5} />}
                        {isInProgress && <Icon name={cfg.icon} size={20} />}
                        {isLocked && <Icon name="lock" size={18} />}
                      </div>
                    </div>

                    {/* Milestone Card */}
                    <div className={`serpentine-card ${step.status}`}>
                      <div className="card-top-bar">
                        <span
                          className="card-metric-pill"
                          style={{ color: cfg.color, background: cfg.bgLight, borderColor: cfg.border }}
                        >
                          <Icon name={cfg.icon} size={12} /> {cfg.label} · {assessmentMetrics[step.metricKey] ?? step.score} pts
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`card-status-pill ${step.status}`}>
                            {isCompleted && <Icon name="check" size={10} stroke={2.5} />}
                            {isInProgress && <span className="sync-dot" style={{ width: '6px', height: '6px', background: '#2563eb' }} />}
                            {isLocked && <Icon name="lock" size={10} />}
                            {isCompleted ? 'Completed ✓' : isInProgress ? 'Current Practice' : 'Locked'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            <Icon name="clock" size={11} style={{ verticalAlign: '-1px' }} /> {step.estimatedMinutes}m
                          </span>
                        </div>
                      </div>

                      <h3 className={`card-title ${isCompleted ? 'struck-off' : ''}`}>
                        {step.title}
                      </h3>
                      <p className={`card-tagline ${isCompleted ? 'struck-off' : ''}`}>
                        {step.tagline}
                      </p>

                      {/* Diagnostic trigger callout */}
                      <div className={`card-diagnostic-callout ${isCompleted ? 'struck-off' : ''}`}>
                        <div className="diagnostic-callout-icon">
                          <Icon name="mic" size={13} />
                        </div>
                        <p className="diagnostic-callout-text">
                          <strong>What we noticed:</strong> "{step.diagnosticNote}"
                        </p>
                      </div>

                      {/* Card Action Controls */}
                      <div className="card-actions-bar">
                        <div className="card-actions-group">
                          <button
                            className="btn-open-drawer"
                            onClick={() => onOpenDrawer(step.id)}
                          >
                            <Icon name="bookOpen" size={13} /> Open Learning Guide
                          </button>

                          <button
                            className={`btn-strike-toggle ${isCompleted ? 'finished' : 'unfinished'}`}
                            onClick={() => onToggleFinish(step.id)}
                            title={isCompleted ? 'Unmark practice' : 'Mark practice as done'}
                          >
                            <Icon name={isCompleted ? 'checkCircle' : 'check'} size={13} stroke={2} />
                            {isCompleted ? 'Completed ✓' : 'Mark as Done ✓'}
                          </button>
                        </div>

                        <button
                          className="btn-drill-link"
                          onClick={() => (onLaunchDrill ? onLaunchDrill(scenarioData[cfg.drillScenario]) : onNavigate('assessments'))}
                        >
                          <Icon name="play" size={11} /> Try Drill
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serpentine Connecting Ribbon to Next Row */}
                {nextStep && (
                  <div className={`serpentine-connector-row ${isLeft ? 'left-to-right' : 'right-to-left'}`}>
                    <svg viewBox="0 0 800 90" preserveAspectRatio="none" className="serpentine-connector-svg">
                      <defs>
                        <linearGradient id={`serp-grad-${step.id}`} x1={isLeft ? '0%' : '100%'} y1="0%" x2={isLeft ? '100%' : '0%'} y2="100%">
                          <stop offset="0%" stopColor={cfg.color} />
                          <stop offset="100%" stopColor={nextCfg.color} />
                        </linearGradient>
                      </defs>

                      {/* Background dashed path */}
                      <path
                        d={isLeft ? 'M 150 5 C 150 75, 650 15, 650 85' : 'M 650 5 C 650 75, 150 15, 150 85'}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="3.5"
                        strokeDasharray="6 6"
                      />

                      {/* Active / Completed path */}
                      {(isCompleted || isInProgress) && (
                        <path
                          d={isLeft ? 'M 150 5 C 150 75, 650 15, 650 85' : 'M 650 5 C 650 75, 150 15, 150 85'}
                          fill="none"
                          stroke={`url(#serp-grad-${step.id})`}
                          strokeWidth={isCompleted ? '4.5' : '3.5'}
                          strokeLinecap="round"
                          className={isInProgress ? 'animated-path-dash' : ''}
                        />
                      )}
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 3: COACHING TAB (COACHING PLAN & ROADMAP)
   ========================================================================== */
/* ==========================================================================
   VIEW 3: COACHING SUITE (DUAL-SIDEBAR LAYOUT & INTERACTIVE MODULES)
   ========================================================================== */
function CoachingView({ onNavigate, onLaunchDrill }) {
  const [activeSubTab, setActiveSubTab] = useState('roadmap'); // 'roadmap' | 'gap-analysis' | 'interventions' | 'drills'
  const [drillCategory, setDrillCategory] = useState('All');

  // Dynamic Assessment Diagnostic Metrics (e.g. Conciseness: 61, Structure: 68, Confidence: 76, Clarity: 84)
  const [assessmentMetrics, setAssessmentMetrics] = useState({
    conciseness: 61,
    structure: 68,
    confidence: 76,
    clarity: 84
  });

  // Dynamic Roadmap Steps State
  const [roadmapSteps, setRoadmapSteps] = useState(() => generateRoadmapFromAssessment(assessmentMetrics));
  const [activeDrawerStepId, setActiveDrawerStepId] = useState(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Auto-dismiss toast feedback
  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [feedbackToast]);

  // Strike off milestone handler: marks completed and advances path
  const handleToggleFinish = (stepId) => {
    setRoadmapSteps((prevSteps) => {
      const stepIndex = prevSteps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return prevSteps;
      const targetStep = prevSteps[stepIndex];
      const isFinishing = targetStep.status !== 'completed';

      return prevSteps.map((s, idx) => {
        if (s.id === stepId) {
          return {
            ...s,
            status: isFinishing ? 'completed' : 'in-progress'
          };
        }
        // When marking finished, automatically unlock the next locked step in sequence
        if (isFinishing && idx === stepIndex + 1 && s.status === 'locked') {
          return {
            ...s,
            status: 'in-progress'
          };
        }
        return s;
      });
    });

    const target = roadmapSteps.find((s) => s.id === stepId);
    if (target && target.status !== 'completed') {
      setFeedbackToast(`Milestone 0${stepId} "${target.title}" struck off as finished!`);
    } else if (target) {
      setFeedbackToast(`Milestone 0${stepId} reopened.`);
    }
  };

  const handleToggleStepCheck = (stepId, actionStepIdx) => {
    setCheckedSteps((prev) => {
      const current = prev[stepId] || {};
      return {
        ...prev,
        [stepId]: {
          ...current,
          [actionStepIdx]: !current[actionStepIdx]
        }
      };
    });
  };

  const handleRecalibrate = (newScores) => {
    const updated = newScores || { conciseness: 61, structure: 68, confidence: 76, clarity: 84 };
    setAssessmentMetrics(updated);
    setRoadmapSteps(generateRoadmapFromAssessment(updated));
    setFeedbackToast('Roadmap trajectory recalibrated from voice diagnostic scores.');
  };

  const selectedNode = roadmapSteps[0] || initialRoadmapData[0];

  // 2. Diagnostic Gap Analysis Data
  const gapMetrics = [
    {
      id: "conciseness",
      title: "Conciseness & Executive Lead",
      current: 61,
      target: 85,
      delta: "-24 pts",
      status: "negative",
      finding: "Over-indexing on backstory setup; average introduction lasts 58s before stating the bottom-line achievement.",
      recommendation: "Lead with the outcome first. Apply the 15-second executive bottom-line rule.",
      targetLabel: "Target: 85 pts"
    },
    {
      id: "star_density",
      title: "STAR Result Quantification",
      current: 58,
      target: 80,
      delta: "-22 pts",
      status: "negative",
      finding: "3 out of 5 answers concluded without quantifiable monetary, time, or customer throughput metrics.",
      recommendation: "Anchor every Result stage with at least one hard KPI ($ saved, latency cut, % growth).",
      targetLabel: "Target: 80%"
    },
    {
      id: "pacing",
      title: "Pacing & Cadence",
      current: 135,
      target: 140,
      currentLabel: "135 WPM",
      targetLabel: "Optimal Range: 130-150",
      delta: "Optimal (+0 pts)",
      status: "optimal",
      fillPct: 75,
      finding: "Natural conversational rhythm. Cadence remained steady and composed under pressure.",
      recommendation: "Maintain this steady speaking cadence across stressful prompts.",
    },
    {
      id: "fillers",
      title: "Filler Frequency",
      current: 2.4,
      target: 1.0,
      currentLabel: "2.4 / min",
      targetLabel: "Benchmark: < 1.0 / min",
      delta: "-1.4 / min",
      status: "negative",
      fillPct: 62,
      finding: "Filler words ('um', 'basically', 'you know') heavily concentrated during the 10-second window when formulating trade-offs.",
      recommendation: "Replace verbal stallers with intentional 1.5-second silent pauses.",
    }
  ];

  // 3. Drill Library Catalog Data
  const drillCatalog = [
    {
      id: "drill-1",
      title: "The 15-Second Executive Lead",
      category: "Conciseness",
      duration: "3 mins",
      level: "Senior",
      recommended: true,
      desc: "Practice stating the quantitative bottom-line in the first 15 seconds before unpacking technical architecture.",
      scenario: "executive"
    },
    {
      id: "drill-2",
      title: "STAR Result Quantification Sprint",
      category: "STAR Structure",
      duration: "5 mins",
      level: "Intermediate",
      recommended: true,
      desc: "Condition your answers to conclude with multi-dimensional impact: financial, engineering velocity, and customer metrics.",
      scenario: "behavioral"
    },
    {
      id: "drill-3",
      title: "The 1.5-Second Intentional Pause",
      category: "Cadence & Pauses",
      duration: "4 mins",
      level: "All Levels",
      recommended: false,
      desc: "Condition your speaking cadence to substitute 'um', 'like', and 'basically' with authoritative silent pauses.",
      scenario: "difficult"
    },
    {
      id: "drill-4",
      title: "High-Stakes Board Risk Briefing",
      category: "Executive Presence",
      duration: "8 mins",
      level: "Executive",
      recommended: true,
      desc: "Simulate a live C-suite briefing on production outages, roadmap trade-offs, and mitigation strategies.",
      scenario: "executive"
    }
  ];

  const filteredDrills = drillCategory === 'All'
    ? drillCatalog
    : drillCatalog.filter(d => d.category === drillCategory);

  return (
    <div className="coaching-dual-container">
      {/* 1. Secondary Nested Sub-Sidebar (~220px) */}
      <aside className="coaching-sub-sidebar">
        <div className="sub-sidebar-header">
          <h4 className="sub-sidebar-title">Coaching Modules</h4>
          <span className="sync-status-chip">
            <span className="sync-dot"/> Synced · Session #24
          </span>
        </div>

        <nav className="sub-sidebar-nav">
          <button
            className={`sub-nav-btn ${activeSubTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('roadmap')}
          >
            <div className="sub-nav-top-row">
              <div className="sub-nav-title-group">
                <Icon name="trend" size={16}/>
                <span className="sub-nav-title">Roadmap &amp; Milestones</span>
              </div>
            </div>
            <span className="sub-nav-subtitle">Trajectory Node Map</span>
          </button>

          <button
            className={`sub-nav-btn ${activeSubTab === 'gap-analysis' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('gap-analysis')}
          >
            <div className="sub-nav-top-row">
              <div className="sub-nav-title-group">
                <Icon name="grid" size={16}/>
                <span className="sub-nav-title">Diagnostic Gap Analysis</span>
              </div>
            </div>
            <span className="sub-nav-subtitle">Target vs. Actual Delta</span>
          </button>

          <button
            className={`sub-nav-btn ${activeSubTab === 'interventions' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('interventions')}
          >
            <div className="sub-nav-top-row">
              <div className="sub-nav-title-group">
                <Icon name="spark" size={16}/>
                <span className="sub-nav-title">Critical Interventions</span>
              </div>
              <span className="sub-badge-rose">3 Focus</span>
            </div>
            <span className="sub-nav-subtitle">High-Priority Leaks</span>
          </button>

          <button
            className={`sub-nav-btn ${activeSubTab === 'drills' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('drills')}
          >
            <div className="sub-nav-top-row">
              <div className="sub-nav-title-group">
                <Icon name="layers" size={16}/>
                <span className="sub-nav-title">Drill Library</span>
              </div>
              <span className="sub-badge-gray">4 Drills</span>
            </div>
            <span className="sub-nav-subtitle">Targeted Mini-Exercises</span>
          </button>
        </nav>

        <div className="sub-sidebar-footer">
          <div className="coach-mini-card">
            <div className="coach-avatar-small">EV</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Dr. Elena Vance</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>AI Executive Coach</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Coaching Canvas */}
      <div className="coaching-canvas">
        {/* SUB-VIEW 1: ROADMAP & MILESTONES (SERPENTINE MILESTONE INFOGRAPHIC) */}
        {activeSubTab === 'roadmap' && (
          <div className="coaching-tab-content">
            {feedbackToast && (
              <div
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  zIndex: 1100,
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <Icon name="checkCircle" size={18} style={{ color: '#10b981' }} />
                {feedbackToast}
              </div>
            )}

            <SerpentineRoadmap
              steps={roadmapSteps}
              assessmentMetrics={assessmentMetrics}
              onOpenDrawer={(id) => setActiveDrawerStepId(id)}
              onToggleFinish={handleToggleFinish}
              onLaunchDrill={onLaunchDrill}
              onNavigate={onNavigate}
              scenarioData={scenarioData}
              onRecalibrate={handleRecalibrate}
            />

            <StepLearningDrawer
              step={roadmapSteps.find((s) => s.id === activeDrawerStepId)}
              isOpen={activeDrawerStepId !== null}
              onClose={() => setActiveDrawerStepId(null)}
              isFinished={roadmapSteps.find((s) => s.id === activeDrawerStepId)?.status === 'completed'}
              onToggleFinished={handleToggleFinish}
              checkedSteps={checkedSteps}
              onToggleStepCheck={handleToggleStepCheck}
              onLaunchDrill={onLaunchDrill}
              scenarioData={scenarioData}
            />
          </div>
        )}

        {/* SUB-VIEW 2: DIAGNOSTIC GAP ANALYSIS */}
        {activeSubTab === 'gap-analysis' && (
          <div className="coaching-tab-content">
            <div className="dashboard-subheader" style={{ marginBottom: 0 }}>
              <div className="subheader-title">
                <h1>Diagnostic Gap Analysis</h1>
                <p>Speech telemetry vs. enterprise executive benchmark calibrated from Session #24</p>
              </div>

              <div className="subheader-controls">
                <button
                  className="btn-primary"
                  onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.executive) : onNavigate('assessments')}
                >
                  <Icon name="mic" size={14}/> Remediation Session
                </button>
              </div>
            </div>

            {/* Gap Summary Metrics */}
            <div className="gap-summary-strip">
              <div className="gap-stat-cell">
                <div className="gap-stat-number">78%</div>
                <div className="gap-stat-desc">Current Composite Index</div>
              </div>
              <div className="gap-stat-cell">
                <div className="gap-stat-number">85%</div>
                <div className="gap-stat-desc">Executive Target Benchmark</div>
              </div>
              <div className="gap-stat-cell">
                <div className="gap-stat-number" style={{ color: '#e11d48' }}>-7 pts</div>
                <div className="gap-stat-desc">Net Readiness Gap</div>
              </div>
              <div className="gap-stat-cell">
                <div className="gap-stat-number" style={{ color: '#059669' }}>2 of 4</div>
                <div className="gap-stat-desc">Dimensions in Optimal Zone</div>
              </div>
            </div>

            {/* Comparative Dual-Slider Tracks Card */}
            <div className="gap-analysis-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ font: '700 15px Space Grotesk', color: '#0f172a', margin: 0 }}>
                  Telemetry Differential by Communication Dimension
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Overlay pins denote the enterprise 85th percentile benchmark
                </span>
              </div>

              <div>
                {gapMetrics.map((gm) => (
                  <div key={gm.id} className="dual-slider-row">
                    <div className="slider-labels-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="slider-metric-title">{gm.title}</span>
                        <span style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                          {gm.targetLabel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          Actual: {gm.currentLabel || `${gm.current} / 100`}
                        </span>
                        <span className={`slider-delta-pill ${gm.status}`}>
                          {gm.delta}
                        </span>
                      </div>
                    </div>

                    {/* Dual Comparative Progress Track */}
                    <div className="dual-track-bar-wrap">
                      <div
                        className={`dual-track-fill ${gm.status}`}
                        style={{ width: `${gm.fillPct || gm.current}%` }}
                      />
                      {/* Ghost Target Pin */}
                      <div
                        className="target-pin-marker"
                        style={{ left: `${gm.id === 'fillers' ? 25 : (gm.target > 100 ? 75 : gm.target)}%` }}
                        title={gm.targetLabel}
                      />
                    </div>

                    <div className="slider-finding-text">
                      <strong>Diagnostic Finding:</strong> {gm.finding}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 3: CRITICAL INTERVENTIONS ("NEEDS URGENT IMPROVEMENT") */}
        {activeSubTab === 'interventions' && (
          <div className="coaching-tab-content">
            <div className="dashboard-subheader" style={{ marginBottom: 0 }}>
              <div className="subheader-title">
                <h1>Critical Delivery Interventions</h1>
                <p>Prioritized communication leaks diagnosed during your latest 5-question test</p>
              </div>

              <div className="subheader-controls">
                <button
                  className="btn-remediation"
                  onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.executive) : onNavigate('assessments')}
                >
                  <Icon name="spark" size={14}/> Start Targeted Remediation Drill (10 min)
                </button>
              </div>
            </div>

            {/* Alert Summary Banner */}
            <div className="intervention-alert-banner">
              <div className="alert-banner-left">
                <div className="alert-icon-avatar">
                  <Icon name="spark" size={22}/>
                </div>
                <div>
                  <h3 className="alert-banner-title">
                    Urgent Improvement Flags: 3 Communication Blockers Detected
                  </h3>
                  <p className="alert-banner-sub">
                    Acoustic NLP analysis detected structural delay and missing outcome metrics in 3 out of 5 prompts.
                    Resolving these 3 focus items will immediately lift your score by an estimated +14 points.
                  </p>
                </div>
              </div>

              <button
                className="btn-remediation"
                onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.behavioral) : onNavigate('assessments')}
              >
                Launch Drill →
              </button>
            </div>

            {/* Intervention Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Card 1: The Situation Trap */}
              <div className="intervention-card-item">
                <div className="intervention-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="intervention-badge high">High Severity</span>
                    <h3 className="intervention-name">1. "The Situation Trap" (Protracted Context)</h3>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.behavioral) : onNavigate('assessments')}
                  >
                    Practice 15s Lead Drill →
                  </button>
                </div>

                <p className="intervention-issue-text">
                  <strong>The Issue:</strong> Answers linger in context setup for over 45 seconds. Executive interviewers and senior stakeholders form their evaluation in the first 20 seconds.
                </p>

                {/* Transcribed Excerpt with Red Highlight Box */}
                <div className="test-excerpt-box">
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Recorded Test Excerpt (Prompt #1) — Red highlights indicate non-essential setup:
                  </div>
                  "<span className="excerpt-red-highlight">Well, back in late 2024 our engineering org noticed that our checkout drop-off rate was climbing and after multiple scrums we figured out that payment gateway timeouts were happening</span> and our database team couldn't isolate the query locks for three days..."
                </div>

                {/* Recommended Before & After Rewrite */}
                <div className="before-after-grid" style={{ marginTop: 0 }}>
                  <div className="snippet-card before">
                    <div className="snippet-title" style={{ color: '#be123c' }}>✕ Unstructured Backstory Lead (58s)</div>
                    "Well, back in late 2024 our engineering org noticed that checkout drop-off was climbing..."
                  </div>
                  <div className="snippet-card after">
                    <div className="snippet-title" style={{ color: '#15803d' }}>✓ Executive Impact Lead (12s)</div>
                    "We eliminated $180K in checkout churn by reducing payment gateway timeout failovers from 4.2s to 350ms across 8 microservices."
                  </div>
                </div>
              </div>

              {/* Card 2: Metric Absence in STAR Results */}
              <div className="intervention-card-item">
                <div className="intervention-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="intervention-badge moderate">Moderate Severity</span>
                    <h3 className="intervention-name">2. Metric Absence in STAR Results</h3>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.executive) : onNavigate('assessments')}
                  >
                    Quantified Impact Sprint (5 min) →
                  </button>
                </div>

                <p className="intervention-issue-text">
                  <strong>The Issue:</strong> 3 out of 5 answers ended with subjective sentiment ("the team was happy") rather than quantified financial, throughput, or time reduction metrics.
                </p>

                <div className="test-excerpt-box">
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Recorded Test Excerpt (Prompt #3) — Missing metric anchor:
                  </div>
                  "...and so we got the distributed cache running and <span className="excerpt-red-highlight">everyone on the product team was really happy and we felt the rollout went smoothly without complaints.</span>"
                </div>

                <div className="before-after-grid" style={{ marginTop: 0 }}>
                  <div className="snippet-card before">
                    <div className="snippet-title" style={{ color: '#be123c' }}>✕ Subjective Outcome</div>
                    "The rollout went smoothly and everyone felt it was a big improvement."
                  </div>
                  <div className="snippet-card after">
                    <div className="snippet-title" style={{ color: '#15803d' }}>✓ Quantified Metric Anchor</div>
                    "The rollout increased daily deployment frequency from 2 to 14, with zero customer-impacting regressions across 120 days."
                  </div>
                </div>
              </div>

              {/* Card 3: Hesitation Clusters in Trade-offs */}
              <div className="intervention-card-item">
                <div className="intervention-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="intervention-badge moderate">Moderate Severity</span>
                    <h3 className="intervention-name">3. Hesitation Clusters in Trade-off Transitions</h3>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData.difficult) : onNavigate('assessments')}
                  >
                    Silent Pause Masterclass (4 min) →
                  </button>
                </div>

                <p className="intervention-issue-text">
                  <strong>The Issue:</strong> Acoustic sensors detected 4 filler words ('um', 'you know') in the 10-second transition when asked to explain architectural compromises.
                </p>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#475569' }}>
                  <strong>Remediation Strategy:</strong> Substitute verbal stallers with a 1.5-second silent pause. Silence conveys executive composure, while fillers signal uncertainty.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-VIEW 4: DRILL LIBRARY */}
        {activeSubTab === 'drills' && (
          <div className="coaching-tab-content">
            <div className="dashboard-subheader" style={{ marginBottom: 0 }}>
              <div className="subheader-title">
                <h1>Targeted Drill Library</h1>
                <p>Focused 3 to 8 minute deliberate practice modules designed for executive speech mastery</p>
              </div>

              <div className="subheader-controls">
                <div className="pill-toggle-group">
                  {['All', 'Conciseness', 'STAR Structure', 'Cadence & Pauses', 'Executive Presence'].map(cat => (
                    <button
                      key={cat}
                      className={`pill-toggle-btn ${drillCategory === cat ? 'active' : ''}`}
                      onClick={() => setDrillCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="drill-library-grid">
              {filteredDrills.map((drill) => (
                <div key={drill.id} className="drill-library-card">
                  <div className="drill-card-top">
                    <span className="panel-badge badge-blue">{drill.category}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>⏱ {drill.duration}</span>
                  </div>

                  <h3 className="drill-card-title">{drill.title}</h3>
                  <p className="drill-card-desc">{drill.desc}</p>

                  <div className="drill-card-footer">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Level: <strong>{drill.level}</strong></span>
                    <button
                      className="btn-primary"
                      onClick={() => onLaunchDrill ? onLaunchDrill(scenarioData[drill.scenario]) : onNavigate('assessments')}
                    >
                      Start Drill <Icon name="arrowRight" size={13}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 4: PROGRESS TAB (DEEP-DIVE GROWTH TIMELINE & SKILLS TABLE)
   ========================================================================== */
function ProgressView() {
  const skillsProgress = [
    { dim: 'Clarity', baseline: '62%', current: '84%', target: '88%', delta: '+22 pts (+35%)', status: 'Dominant Skill', color: 'green' },
    { dim: 'Confidence', baseline: '58%', current: '76%', target: '82%', delta: '+18 pts (+31%)', status: 'Strong Cadence', color: 'blue' },
    { dim: 'Story Structure (STAR)', baseline: '45%', current: '68%', target: '80%', delta: '+23 pts (+51%)', status: 'Rapid Acceleration', color: 'green' },
    { dim: 'Conciseness', baseline: '48%', current: '61%', target: '75%', delta: '+13 pts (+27%)', status: 'Active Focus', color: 'amber' },
    { dim: 'Vocabulary & Tone', baseline: '60%', current: '73%', target: '80%', delta: '+13 pts (+22%)', status: 'Proficient', color: 'blue' },
  ];

  const milestones = [
    {
      title: 'First 75+ Score',
      sub: 'Achieved Apr 18 · Scored 78 in Behavioral Sprint',
      icon: '🏆',
      status: 'Unlocked',
      unlocked: true,
    },
    {
      title: 'STAR Architect',
      sub: 'Achieved May 04 · 100% adherence across all 4 stages',
      icon: '🎯',
      status: 'Unlocked',
      unlocked: true,
    },
    {
      title: 'Pause Master',
      sub: 'Achieved Jun 02 · 0 fillers detected in 3-min answer',
      icon: '⚡',
      status: 'Unlocked',
      unlocked: true,
    },
    {
      title: 'Executive Fluency',
      sub: 'Current 82% · Requires 85% composite score',
      icon: '🚀',
      status: 'In Progress (82%)',
      unlocked: false,
    },
  ];

  return (
    <div className="tab-view-container">
      {/* Subheader */}
      <div className="dashboard-subheader">
        <div className="subheader-title">
          <h1>Speech Growth & Skill Progression</h1>
          <p>Longitudinal competency tracking, milestone badges, and skill velocity</p>
        </div>

        <div className="subheader-controls">
          <div className="timeframe-select">
            <Icon name="calendar" size={15} style={{ color: '#2563eb' }}/>
            <span>Past 6 Months: <strong>Jan - Jun 2025</strong></span>
          </div>

          <button
            className="export-summary-btn"
            onClick={() => alert('Downloading Comprehensive Growth PDF Report...')}
          >
            <Icon name="download" size={15}/> Download Progress PDF
          </button>
        </div>
      </div>

      {/* 1. "Your Growth Story" Card */}
      <div className="growth-summary-card">
        <div className="growth-hero-metrics">
          <span className="growth-big-stat">+24 Points</span>
          <span className="growth-big-stat-sub">Overall score gain since January (+44% acceleration)</span>
        </div>

        {/* 4 Stat Boxes */}
        <div className="progress-stats-strip">
          <div className="stat-box-card">
            <div className="stat-box-val">24</div>
            <div className="stat-box-lbl">Practice Sessions</div>
          </div>
          <div className="stat-box-card">
            <div className="stat-box-val">48</div>
            <div className="stat-box-lbl">Prompts Answered</div>
          </div>
          <div className="stat-box-card">
            <div className="stat-box-val">8.4 hrs</div>
            <div className="stat-box-lbl">Speaking Time</div>
          </div>
          <div className="stat-box-card">
            <div className="stat-box-val">86%</div>
            <div className="stat-box-lbl">Highest Single Score</div>
          </div>
        </div>

        {/* Detailed Timeline Spline Chart */}
        <div style={{ position: 'relative', marginTop: '10px' }}>
          <svg viewBox="0 0 760 160" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <defs>
              <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            {/* Benchmark target line */}
            <line x1="30" y1="36" x2="730" y2="36" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4"/>
            <text x="735" y="40" fontSize="10" fontWeight="700" fill="#f59e0b">Target 85%</text>

            <path
              d="M 30 120 L 170 102 L 310 84 L 450 68 L 590 62 L 730 54 L 730 150 L 30 150 Z"
              fill="url(#growthGrad)"
            />
            <path
              d="M 30 120 L 170 102 L 310 84 L 450 68 L 590 62 L 730 54"
              fill="none"
              stroke="#2563eb"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {[
              { m: 'Jan', s: 54, x: 30, y: 120 },
              { m: 'Feb', s: 62, x: 170, y: 102 },
              { m: 'Mar', s: 69, x: 310, y: 84 },
              { m: 'Apr', s: 74, x: 450, y: 68 },
              { m: 'May', s: 76, x: 590, y: 62 },
              { m: 'Jun', s: 78, x: 730, y: 54 },
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5"/>
                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
                  {p.s}
                </text>
                <text x={p.x} y="152" textAnchor="middle" fontSize="11" fontWeight="600" fill="#94a3b8">
                  {p.m}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* 2. Milestones List */}
      <div className="section-card">
        <div className="section-title-row">
          <div>
            <h2 className="section-title">
              <Icon name="award" size={18} style={{ color: '#2563eb' }}/>
              Milestones & Achievements
            </h2>
            <p className="section-desc">Key competency thresholds unlocked through deliberate practice sessions.</p>
          </div>
        </div>

        <div className="milestones-grid">
          {milestones.map((m, idx) => (
            <div key={idx} className={`milestone-badge-card ${m.unlocked ? 'unlocked' : ''}`}>
              <div className="milestone-icon-row">
                <span className="milestone-icon">{m.icon}</span>
                <span className="milestone-status-chip">{m.status}</span>
              </div>
              <h4 className="milestone-title">{m.title}</h4>
              <p className="milestone-sub">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Detailed Horizontal Skill Movement Breakdown Table */}
      <div className="section-card">
        <div className="section-title-row">
          <div>
            <h2 className="section-title">
              <Icon name="trend" size={18} style={{ color: '#2563eb' }}/>
              Skill Movement Breakdown
            </h2>
            <p className="section-desc">Comprehensive comparative view across all measured speech dimensions.</p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="skills-table">
            <thead>
              <tr>
                <th>Skill Dimension</th>
                <th>Baseline (Jan)</th>
                <th>Current (Jun)</th>
                <th>Target</th>
                <th>Trajectory (Delta)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {skillsProgress.map((sk, idx) => (
                <tr key={idx}>
                  <td><strong>{sk.dim}</strong></td>
                  <td>{sk.baseline}</td>
                  <td><strong style={{ color: '#0f172a' }}>{sk.current}</strong></td>
                  <td style={{ color: '#64748b' }}>{sk.target}</td>
                  <td>
                    <span className={`badge-tag ${sk.color}`}>
                      {sk.delta}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
                      {sk.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 5: REPORTS TAB (DOWNLOADABLE SESSION REPORT LOG & TRANSCRIPTS)
   ========================================================================== */
export const downloadReportAsText = (report) => {
  const content = `================================================================================
VOICEPRINT AI · CANDIDATE SPEECH & INTERVIEW AUDIT REPORT
================================================================================
Session ID:        ${report.id}
Assessment Date:   ${report.date}
Candidate Name:    Alex Smith
Track / Scenario:  ${report.scenario}
Topic / Prompt:    "${report.prompt}"

--------------------------------------------------------------------------------
1. CORE PERFORMANCE TELEMETRY
--------------------------------------------------------------------------------
Overall Readiness Score:      ${report.score} / 100
Structure / Cadence Metric:   ${report.star}
Delivery Speed:               ${report.pacing}
Fillers Detected:             ${report.fillers}
Clarity Rating:               ${report.score >= 90 ? '94%' : report.score >= 80 ? '89%' : '82%'}

--------------------------------------------------------------------------------
2. VERBATIM SPEECH TRANSCRIPTION
--------------------------------------------------------------------------------
"${report.transcript}"

--------------------------------------------------------------------------------
3. AI EVALUATOR & COACH RUBRIC NOTES
--------------------------------------------------------------------------------
${report.notes}

--------------------------------------------------------------------------------
4. ACTIONABLE RECOMMENDATIONS FOR NEXT SESSION
--------------------------------------------------------------------------------
- Maintain deliberate 1.0s - 1.5s pauses before introducing numerical figures.
- Continue framing technical contributions with measurable business impact.
- Keep filler word frequency under 1 occurrence per response.

================================================================================
Generated by voiceprint v2.0 · Communication & Interview Intelligence Engine
Report Timestamp: ${new Date().toLocaleString()}
================================================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.id}-Voiceprint-Audit-Report.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAllReports = (reports) => {
  const header = "Session ID,Date,Track,Prompt,Score,Structure,Pacing,Fillers,Evaluator Notes\n";
  const rows = reports.map(r => 
    `"${r.id}","${r.date}","${r.scenario}","${r.prompt.replace(/"/g, '""')}","${r.score}","${r.star}","${r.pacing}","${r.fillers}","${r.notes.replace(/"/g, '""')}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Voiceprint-Executive-Audit-Summary-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function ReportsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReportModal, setActiveReportModal] = useState(null);

  const reportRecords = [
    {
      id: 'REP-1024',
      date: 'Jun 12, 2025 · 14:30',
      scenario: '1-on-1 Mock Interview',
      prompt: 'Distributed cache bottleneck & incident recovery',
      score: 89,
      star: '4/4 stages',
      pacing: '136 WPM',
      fillers: '1 filler',
      transcript: "When our primary Redis cluster experienced silent memory eviction during peak checkout, our API latency spiked from 45ms to 4.2 seconds. Rather than assigning blame, I assembled our infra and backend leads to immediately switch read traffic to our secondary replica while introducing TTL tiering. We restored 99.9% uptime within 14 minutes, preventing an estimated $140K in checkout churn.",
      notes: 'Superb STAR articulation. Result impact quantified with financial ($140K) and uptime metrics (99.9%). Action stage demonstrated decisive technical leadership.'
    },
    {
      id: 'REP-1023',
      date: 'Jun 08, 2025 · 11:15',
      scenario: 'Group Discussion (GD)',
      prompt: 'Generative AI vs. Core Foundational Engineering Skills',
      score: 92,
      star: 'Clean Turn Cadence',
      pacing: '140 WPM',
      fillers: '0 fillers',
      transcript: "Building on what Priya and Rohan highlighted, the crucial factor is verification. AI-generated code must be treated with zero-trust until proven through rigorous automated regression suites and load testing. Elevating engineers to architectural thinking only works if fundamentals in memory allocation and algorithmic complexity remain intact.",
      notes: 'Exceptional intervention timing (0.8s natural pause window). Acknowledged peer contributions respectfully before introducing constructive consensus.'
    },
    {
      id: 'REP-1022',
      date: 'May 28, 2025 · 16:45',
      scenario: 'Technical Architecture',
      prompt: 'Migrating legacy monolith to event-driven queue',
      score: 84,
      star: '4/4 stages',
      pacing: '134 WPM',
      fillers: '1 filler',
      transcript: "To eliminate synchronous coupling in our order fulfillment pipeline, I architected an event-driven queue using Apache Kafka. By establishing idempotent consumer workers and a dead-letter exchange, we decoupled checkout from billing, reducing peak p99 latency by 68%.",
      notes: 'High architectural precision. Clear tradeoff explanation between consistency guarantees and throughput.'
    },
  ];

  const filteredRecords = reportRecords.filter(r =>
    r.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="tab-view-container">
      {/* Subheader */}
      <div className="dashboard-subheader">
        <div className="subheader-title">
          <h1>Session Reports &amp; Transcripts</h1>
          <p>Comprehensive audit logs, question rubrics, acoustic telemetry, and downloadable reports</p>
        </div>

        <div className="subheader-controls">
          <div className="search-input-wrap">
            <span className="search-icon-pos"><Icon name="search" size={14}/></span>
            <input
              type="text"
              placeholder="Search session reports…"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="export-summary-btn"
            onClick={() => downloadAllReports(filteredRecords)}
            title="Download CSV audit summary"
          >
            <Icon name="download" size={15}/> Export Reports (CSV)
          </button>
        </div>
      </div>

      {/* Quick Stat Summary Banner */}
      <div className="reports-summary-banner">
        <div className="stat-box-card">
          <div className="stat-box-val">{reportRecords.length}</div>
          <div className="stat-box-lbl">Recorded Practice Sessions</div>
        </div>
        <div className="stat-box-card">
          <div className="stat-box-val">88.3%</div>
          <div className="stat-box-lbl">Average Evaluation Score</div>
        </div>
        <div className="stat-box-card">
          <div className="stat-box-val">94%</div>
          <div className="stat-box-lbl">STAR / Cadence Adherence</div>
        </div>
        <div className="stat-box-card">
          <div className="stat-box-val">0.7 / min</div>
          <div className="stat-box-lbl">Avg Filler Frequency</div>
        </div>
      </div>

      {/* Session Audit Log Table */}
      <div className="section-card">
        <div className="section-title-row">
          <div>
            <h2 className="section-title">
              <Icon name="fileText" size={18} style={{ color: '#2563eb' }}/>
              Completed Assessment Records
            </h2>
            <p className="section-desc">Showing {filteredRecords.length} recorded practice sessions with full downloadable audit logs.</p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="skills-table">
            <thead>
              <tr>
                <th>Session ID &amp; Date</th>
                <th>Scenario Track</th>
                <th>Question Prompt</th>
                <th>Overall Score</th>
                <th>Structure / Cadence</th>
                <th>Pace &amp; Fillers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rep) => (
                <tr key={rep.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{rep.id}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{rep.date}</div>
                  </td>
                  <td>
                    <span className="scenario-badge">{rep.scenario}</span>
                  </td>
                  <td style={{ maxWidth: '260px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{rep.prompt}</div>
                  </td>
                  <td>
                    <span className={`badge-tag ${rep.score >= 90 ? 'green' : rep.score >= 80 ? 'blue' : 'amber'}`}>
                      {rep.score} / 100
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{rep.star}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '11px', color: '#334155' }}>{rep.pacing}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{rep.fillers}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="action-btn-sm primary"
                        onClick={() => setActiveReportModal(rep)}
                      >
                        View Transcript
                      </button>
                      <button
                        className="action-btn-sm"
                        onClick={() => downloadReportAsText(rep)}
                        title="Download Session Report (TXT)"
                      >
                        <Icon name="download" size={12}/> Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Drawer Modal */}
      {activeReportModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 16, 38, 0.72)',
          backdropFilter: 'blur(3px)',
          zIndex: 100,
          display: 'grid',
          placeItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            padding: '26px 30px',
            boxShadow: '0 24px 48px rgba(0,0,0,0.28)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '12px' }}>
                  {activeReportModal.id}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{activeReportModal.date}</span>
              </div>
              <button
                onClick={() => setActiveReportModal(null)}
                style={{ color: '#64748b', fontSize: '18px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <h2 style={{ font: '700 18px Space Grotesk', margin: '0 0 14px', color: '#0f172a' }}>
              "{activeReportModal.prompt}"
            </h2>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px 20px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                RECORDED TRANSCRIPTION
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#1e293b', margin: 0 }}>
                "{activeReportModal.transcript}"
              </p>
            </div>

            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>
                AI COACH EVALUATION NOTES
              </div>
              <div style={{ fontSize: '12px', color: '#14532d', lineHeight: '1.5' }}>
                {activeReportModal.notes}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setActiveReportModal(null)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  downloadReportAsText(activeReportModal);
                }}
              >
                <Icon name="download" size={14}/> Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SIMULATOR MODAL: GROUP DISCUSSION (GD) ROOM
   ========================================================================== */
/* ==========================================================================
   VOICE UTILITY: NATIVE BROWSER SPEECH SYNTHESIS
   ========================================================================== */
export const speakText = (text, onEnd, pitch = 1.0, rate = 0.95) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 1200);
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('Speech synthesis error:', e);
    if (onEnd) onEnd();
  }
};

/* ==========================================================================
   VIEW 1: 1-ON-1 AI INTERVIEWER (VOICE-FIRST INTERACTIVE FLOW)
   ========================================================================== */
const interviewQuestions = [
  {
    id: 1,
    category: 'Technical Bottleneck & Troubleshooting',
    question: "Can you describe a challenging technical bottleneck you resolved recently, and how you measured the outcome?",
    transcriptTemplate: "When our Redis cluster suffered silent memory eviction during peak flash sales, API p99 latency surged from 45ms to 4.2 seconds. Rather than restarting nodes blindly, I inspected key distributions, identified unindexed cache keys, and routed read-heavy queries through read replicas while implementing TTL tiering. Latency recovered to 38ms within 18 minutes with zero checkout drop-offs.",
    starScore: 92,
    clarityScore: 88,
    fillers: 1,
    tip: "Excellent quantification of before/after metrics. Clear action-oriented sequence."
  },
  {
    id: 2,
    category: 'Distributed Systems & Tradeoffs',
    question: "How do you evaluate consistency versus availability tradeoffs when designing a high-throughput transaction service?",
    transcriptTemplate: "For financial ledgers and seat reservations, I prioritize strict linearizability using distributed locks with idempotency keys. Conversely, for search indices or telemetry metrics, eventual consistency with background reconciliation provides necessary throughput without blocking user transactions.",
    starScore: 89,
    clarityScore: 91,
    fillers: 0,
    tip: "Strong practical application of the CAP theorem tailored to distinct business domains."
  },
  {
    id: 3,
    category: 'Architectural Disagreements & Collaboration',
    question: "Tell me about a time you had a strong disagreement with a senior engineer on system design. How was it resolved?",
    transcriptTemplate: "A senior colleague advocated for a bespoke in-house ORM framework. I was concerned about long-term maintenance debt. Instead of arguing theoretical points, I created an isolated benchmark prototype comparing schema migrations. The data proved an industry-standard ORM saved approximately 14 engineering hours per sprint, gaining unanimous consensus.",
    starScore: 94,
    clarityScore: 90,
    fillers: 1,
    tip: "Great demonstration of data-driven persuasion and collaborative maturity."
  },
  {
    id: 4,
    category: 'Agile Delivery & Ambiguity',
    question: "Describe a situation where external API contracts shifted 48 hours before release. How did you safeguard the delivery date?",
    transcriptTemplate: "Our third-party payment partner deprecated their response payload format two days before launch. I rapidly drafted an adapter pattern proxy inside our API gateway. This isolated the legacy schema from our core services and allowed QA to validate the contract without modifying our internal backend services.",
    starScore: 91,
    clarityScore: 87,
    fillers: 2,
    tip: "Proactive risk containment using standard architectural design patterns."
  },
  {
    id: 5,
    category: 'Mentorship & Engineering Standards',
    question: "How do you uphold high code quality standards while onboarding junior developers during tight project timelines?",
    transcriptTemplate: "I rely on automated CI gates, pre-commit linting, and clear PR review rubrics so discussions center on design architecture rather than syntax style. During the first two weeks, I pair-program through critical PRs to model debugging heuristics directly.",
    starScore: 95,
    clarityScore: 93,
    fillers: 0,
    tip: "Outstanding balance between systematic automation and hands-on empathetic mentorship."
  }
];

function AIMockInterviewModal({ onClose, onComplete }) {
  const [stage, setStage] = useState('greeting'); // 'greeting' | 'question' | 'answering' | 'evaluated' | 'completed'
  const [qIndex, setQIndex] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(true);
  const [speechStatusText, setSpeechStatusText] = useState('AI Interviewer is speaking...');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedQuestions, setEvaluatedQuestions] = useState([]);

  const currentQ = interviewQuestions[qIndex];

  // Stop speech when modal closes
  const handleExit = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  // Step 1: Initial AI Greeting
  useEffect(() => {
    const greetingText = "Hello Alex, welcome to your mock interview session. I'll evaluate your communication, structure, and technical depth. Let's begin.";
    setAiSpeaking(true);
    setSpeechStatusText('AI Interviewer is speaking greeting...');

    speakText(greetingText, () => {
      // Once greeting ends, automatically transition to Question 1
      setStage('question');
      setSpeechStatusText('AI Interviewer is asking Question 1...');
      speakQuestion(0);
    });

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // AI speaks question
  const speakQuestion = (index) => {
    const qObj = interviewQuestions[index];
    setAiSpeaking(true);
    setSpeechStatusText(`AI Interviewer is speaking Question ${index + 1}...`);
    
    speakText(qObj.question, () => {
      setAiSpeaking(false);
      setSpeechStatusText('Your turn — Tap to record your answer');
    });
  };

  // User recording timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = () => {
    if (aiSpeaking) return;
    setIsRecording(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    setStage('answering');

    // Simulate real-time progressive transcript streaming
    const fullText = currentQ.transcriptTemplate;
    const words = fullText.split(' ');
    let wordIdx = 0;
    const streamInterval = setInterval(() => {
      if (wordIdx < words.length) {
        setLiveTranscript(words.slice(0, wordIdx + 4).join(' '));
        wordIdx += 4;
      } else {
        clearInterval(streamInterval);
      }
    }, 450);
  };

  const handleFinishRecording = () => {
    setIsRecording(false);
    setEvaluating(true);
    setSpeechStatusText('Analyzing live audio telemetry and STAR structure...');

    setTimeout(() => {
      setEvaluating(false);
      setStage('evaluated');
      setSpeechStatusText('Answer evaluated');
      setEvaluatedQuestions((prev) => [
        ...prev,
        {
          qNum: qIndex + 1,
          question: currentQ.question,
          answer: liveTranscript || currentQ.transcriptTemplate,
          starScore: currentQ.starScore,
          clarityScore: currentQ.clarityScore,
          fillers: currentQ.fillers,
          tip: currentQ.tip
        }
      ]);
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (qIndex < interviewQuestions.length - 1) {
      const nextIdx = qIndex + 1;
      setQIndex(nextIdx);
      setStage('question');
      setLiveTranscript('');
      setRecordingSeconds(0);
      speakQuestion(nextIdx);
    } else {
      setStage('completed');
    }
  };

  return (
    <div className="gd-modal-overlay">
      <div className="gd-modal-container" style={{ maxWidth: 840 }}>
        {/* Modal Header */}
        <div className="gd-modal-header">
          <div>
            <div className="job-prep-pill-badge" style={{ marginBottom: 4 }}>
              <Icon name="mic" size={13} style={{ color: '#2563eb' }}/>
              <span>Voice-First AI Technical & Behavioral Interview</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
              1-on-1 AI Interviewer {stage !== 'completed' ? `· Question ${qIndex + 1} of 5` : '· Summary Report'}
            </h3>
          </div>
          <button 
            className="action-btn-sm" 
            onClick={handleExit} 
            title="Exit Session"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', color: '#475569', fontWeight: 600 }}
          >
            <Icon name="x" size={14}/>
            <span>Exit Session</span>
          </button>
        </div>

        {stage !== 'completed' ? (
          <div style={{ padding: '24px 28px' }}>
            {/* AI Soundwave / Speaking Visual Centerpiece */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '24px 20px',
              textAlign: 'center',
              marginBottom: 20
            }}>
              {/* Avatar Orb */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <div className={`ai-avatar-orb ${aiSpeaking ? 'speaking' : ''}`}>
                  <Icon name="mic" size={30} style={{ color: '#ffffff' }}/>
                </div>
              </div>

              {/* Status Banner */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {aiSpeaking ? (
                  <div className="interview-turn-cue-banner cue-ai-speaking">
                    <span className="speaking-soundwave-indicator">
                      <span/><span/><span/>
                    </span>
                    <span>{speechStatusText}</span>
                  </div>
                ) : (
                  <div className="interview-turn-cue-banner cue-user-turn">
                    <Icon name="spark" size={13} style={{ color: '#047857' }}/>
                    <span>Your turn — Tap to record your answer</span>
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div style={{ marginTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                  {currentQ.category}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '8px 0 0 0', lineHeight: 1.4 }}>
                  "{currentQ.question}"
                </h2>
              </div>
            </div>

            {/* User Interaction Deck */}
            {stage === 'evaluated' ? (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 14,
                padding: '20px 22px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#047857', background: '#d1fae5', padding: '3px 8px', borderRadius: 6 }}>
                      STAR Structure: {currentQ.starScore}%
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '3px 8px', borderRadius: 6 }}>
                      Clarity: {currentQ.clarityScore}%
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                      Fillers: {currentQ.fillers}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>Answer Evaluated ✓</span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: 12.5, color: '#0f172a', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{liveTranscript || currentQ.transcriptTemplate}"
                </p>
                <div style={{ fontSize: 12, color: '#065f46', background: '#ffffff', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1fae5' }}>
                  <strong>Coach Rubric Feedback:</strong> {currentQ.tip}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 18,
                textAlign: 'center',
                marginBottom: 16
              }}>
                {isRecording ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'aiOrbPulse 1s infinite' }}/>
                      <strong style={{ fontSize: 14, color: '#dc2626' }}>Recording Answer: {recordingSeconds}s</strong>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '12px 14px',
                      textAlign: 'left',
                      minHeight: 60,
                      fontSize: 12.5,
                      color: '#1e293b',
                      lineHeight: 1.5
                    }}>
                      {liveTranscript || 'Listening to your speech response...'}
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                    {aiSpeaking 
                      ? 'Microphone button is disabled while the AI interviewer speaks question aloud...'
                      : 'AI has finished speaking. Press the microphone button below to record your response.'}
                  </p>
                )}
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="gd-modal-controls" style={{ padding: '12px 0 0 0', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Question <strong>{qIndex + 1} of 5</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {stage === 'evaluated' ? (
                  <button 
                    className="action-pill-btn" 
                    style={{ background: '#2563eb', padding: '10px 20px', fontSize: 13 }}
                    onClick={handleNextQuestion}
                  >
                    <span>{qIndex < interviewQuestions.length - 1 ? 'Next Question →' : 'View Session Report →'}</span>
                  </button>
                ) : isRecording ? (
                  <button 
                    className="action-pill-btn" 
                    style={{ background: '#dc2626', padding: '10px 20px', fontSize: 13 }}
                    onClick={handleFinishRecording}
                  >
                    <Icon name="stop" size={15}/>
                    <span>Finish Recording &amp; Evaluate</span>
                  </button>
                ) : (
                  <button 
                    className="action-pill-btn" 
                    style={{ 
                      background: aiSpeaking ? '#94a3b8' : '#059669', 
                      cursor: aiSpeaking ? 'not-allowed' : 'pointer',
                      padding: '10px 22px', 
                      fontSize: 13 
                    }}
                    onClick={handleStartRecording}
                    disabled={aiSpeaking}
                  >
                    <Icon name="mic" size={16}/>
                    <span>{aiSpeaking ? 'AI Speaking...' : 'Tap to Record Answer'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Session Completed Summary Screen */
          <div style={{ padding: '24px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 10px auto'
              }}>
                <Icon name="check" size={28}/>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Mock Interview Complete!
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                5 of 5 questions answered and scored against standard placement rubrics.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>92.2%</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Average STAR Score</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>89.8%</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Speech Clarity Index</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>0.8 / min</div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Filler Word Frequency</div>
              </div>
            </div>

            <div className="gd-modal-controls" style={{ padding: 0 }}>
              <button 
                className="btn-secondary"
                onClick={handleExit}
                style={{ padding: '10px 18px', fontSize: 13 }}
              >
                Return to Job Prep Hub
              </button>
              <button 
                className="action-pill-btn"
                onClick={() => {
                  onComplete();
                }}
                style={{ background: '#0f172a', padding: '10px 20px', fontSize: 13 }}
              >
                Save to Performance History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 2: GROUP DISCUSSION (GD) SIMULATOR (MULTI-SPEAKER AUDIO ROOM)
   ========================================================================== */
const gdTopics = [
  {
    id: 'gen-ai',
    title: "Is Generative AI empowering developers or eroding core foundational engineering skills?",
    context: "Campus Placement / Tech Leadership Round",
    rule: "Intervene cleanly during pause cadences (0.5s - 1.2s window). Avoid interrupting mid-sentence."
  },
  {
    id: 'iot-edge',
    title: "Centralized vs. Edge Architecture: Reliability tradeoffs in mission-critical IoT systems",
    context: "Systems & Infrastructure Placement Round",
    rule: "Acknowledge peer points before introducing contrasting reliability metrics."
  },
  {
    id: 'monolith-micro',
    title: "Monolith vs. Microservices: Have engineering teams over-engineered basic web applications?",
    context: "Full-Stack & Architectural Hiring Panel",
    rule: "Balance cost, latency, and team communication overhead."
  }
];

function AudioGDRoomModal({ onClose, onComplete }) {
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [activeSpeaker, setActiveSpeaker] = useState('Rohan'); // 'Rohan' | 'Priya' | 'Karthik' | 'Alex' | 'Pause'
  const [isUserIntervening, setIsUserIntervening] = useState(false);
  const [userSpeakingTime, setUserSpeakingTime] = useState(0);
  const [interventionTimingScore, setInterventionTimingScore] = useState('0.8s (Ideal Pause Window)');
  const [constructiveScore, setConstructiveScore] = useState(94);
  const [fillerWords, setFillerWords] = useState(0);
  const [discussionTranscript, setDiscussionTranscript] = useState([]);
  const [statusMessage, setStatusMessage] = useState('Rohan is laying out the opening perspective...');

  const topic = gdTopics[selectedTopicIdx];

  const handleExit = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onClose();
  };

  // Start discussion loop
  useEffect(() => {
    startDialogueSequence(selectedTopicIdx);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedTopicIdx]);

  // Dialogue script engine
  const startDialogueSequence = (topicIdx) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setActiveSpeaker('Rohan');
    setStatusMessage('Speaker 1: Rohan is presenting the opening argument...');

    const rohanOpening = "Thank you all for being here. On this topic, I believe generative AI significantly accelerates developer velocity by automating boilerplate code and boilerplate unit tests. However, junior engineers risk treating LLMs as opaque black boxes without understanding memory allocation or asymptotic complexity.";

    setDiscussionTranscript([
      { speaker: 'Rohan', text: rohanOpening, tag: 'Opening Argument' }
    ]);

    // Rohan speaks aloud with rate: 0.95, pitch: 0.88
    speakText(rohanOpening, () => {
      // 2-second pause cadence
      setActiveSpeaker('Pause');
      setStatusMessage('Natural discussion pause (Opportunity for intervention)...');

      setTimeout(() => {
        // If user hasn't intervened, Priya chimes in automatically
        setActiveSpeaker((current) => {
          if (current === 'Alex') return 'Alex'; // user intervened

          setStatusMessage('Speaker 2: Priya is offering a counter-perspective...');
          const priyaCounter = "I see Rohan's point, but I'd offer a counter-perspective. Software engineering was never about memorizing syntax; it's about system design, domain modeling, and trade-off analysis. Generative AI elevates engineers to think at the architectural level rather than getting bogged down in boilerplate.";

          setDiscussionTranscript((prev) => [
            ...prev,
            { speaker: 'Priya', text: priyaCounter, tag: 'Counter-Perspective' }
          ]);

          // Priya speaks aloud with rate: 1.0, pitch: 1.15
          speakText(priyaCounter, () => {
            setActiveSpeaker((c) => {
              if (c === 'Alex') return 'Alex';
              setStatusMessage('Discussion open. Click "Intervene / Enter Discussion" to take the floor.');
              return 'None';
            });
          }, 1.15, 1.0);

          return 'Priya';
        });
      }, 2000);
    }, 0.88, 0.95);
  };

  // User intervention handler
  const handleUserIntervene = () => {
    // 1. Immediately cancel AI speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 2. Activate user microphone
    setIsUserIntervening(true);
    setActiveSpeaker('Alex');
    setStatusMessage('You have the floor! Live microphone tracking active...');
    setInterventionTimingScore('0.7s — Clean Turn Entry (No Interruption)');
    setUserSpeakingTime(14);
    setFillerWords(1);
    setConstructiveScore(96);

    const userEntry = "Building on what Priya and Rohan highlighted, the crucial factor is verification. AI-generated code must be treated with zero-trust until proven through rigorous automated regression suites and load testing.";
    
    setDiscussionTranscript((prev) => [
      ...prev,
      { speaker: 'You (Alex Smith)', text: userEntry, tag: 'Constructive Synthesis & Argument' }
    ]);
  };

  // User yields the floor -> Karthik responds directly to user
  const handleYieldFloor = () => {
    setIsUserIntervening(false);
    setActiveSpeaker('Karthik');
    setStatusMessage('Speaker 3: Karthik is responding directly to your point...');

    const karthikResponse = "Building directly on what Alex just articulated, that exact balance between abstraction and debugging telemetry is where top engineering teams win. If you can't trace a distributed deadlock when the AI generated the code, your mean time to recovery doubles.";

    setDiscussionTranscript((prev) => [
      ...prev,
      { speaker: 'Karthik', text: karthikResponse, tag: 'Direct Rebuttal & Consensus' }
    ]);

    // Karthik speaks aloud with rate: 1.02, pitch: 0.98
    speakText(karthikResponse, () => {
      setActiveSpeaker('None');
      setStatusMessage('Round concluded. Click "Finish & View Rubric" or select another topic.');
    }, 0.98, 1.02);
  };

  const candidates = [
    { name: 'Rohan Sharma', role: 'Candidate 02 · Systems', isSpeaker: activeSpeaker === 'Rohan', voiceShare: '26%' },
    { name: 'Priya Nair', role: 'Candidate 03 · Product Lead', isSpeaker: activeSpeaker === 'Priya', voiceShare: '24%' },
    { name: 'Karthik Reddy', role: 'Candidate 04 · Infrastructure', isSpeaker: activeSpeaker === 'Karthik', voiceShare: '22%' },
    { name: 'You (Alex Smith)', role: 'Candidate 01 · You', isSpeaker: activeSpeaker === 'Alex', isUser: true, voiceShare: `${userSpeakingTime || 28}%` },
  ];

  return (
    <div className="gd-modal-overlay">
      <div className="gd-modal-container" style={{ maxWidth: 880 }}>
        {/* Header */}
        <div className="gd-modal-header">
          <div>
            <div className="job-prep-pill-badge" style={{ marginBottom: 4 }}>
              <Icon name="users" size={13} style={{ color: '#059669' }}/>
              <span>Multi-Speaker Campus Placement Simulation</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Group Discussion Audio Room</h3>
          </div>
          <button 
            className="action-btn-sm" 
            onClick={handleExit}
            title="Exit Session"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', color: '#475569', fontWeight: 600 }}
          >
            <Icon name="x" size={14}/>
            <span>Exit Session</span>
          </button>
        </div>

        {/* Topic Banner & Selector */}
        <div className="gd-topic-banner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              GD Round Topic
            </span>
            <select
              value={selectedTopicIdx}
              onChange={(e) => setSelectedTopicIdx(Number(e.target.value))}
              style={{
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b'
              }}
            >
              {gdTopics.map((t, idx) => (
                <option key={t.id} value={idx}>Topic {idx + 1}: {t.id}</option>
              ))}
            </select>
          </div>

          <h4 style={{ margin: '0 0 6px 0', fontSize: 15, color: '#0f172a', lineHeight: 1.4 }}>
            "{topic.title}"
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
            <strong>Moderator Guideline:</strong> {topic.rule}
          </p>
        </div>

        {/* 4 Candidates Grid */}
        <div className="gd-candidates-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {candidates.map((cand, idx) => (
            <div 
              key={idx} 
              className={`gd-candidate-card ${cand.isUser ? 'user' : ''} ${cand.isSpeaker ? 'speaking' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{cand.name}</span>
                {cand.isSpeaker && (
                  <span className="speaking-soundwave-indicator">
                    <span/><span/><span/>
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>{cand.role}</span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                <span style={{ color: '#94a3b8' }}>Voice Share:</span>
                <strong style={{ color: cand.isSpeaker ? '#059669' : '#0f172a' }}>
                  {cand.voiceShare}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* Live Discussion Status & Transcript Preview */}
        <div style={{ padding: '0 24px 14px' }}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: activeSpeaker !== 'None' ? '#059669' : '#94a3b8'
            }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
              {statusMessage}
            </span>
          </div>

          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 12,
            maxHeight: 120,
            overflowY: 'auto',
            fontSize: 12,
            color: '#334155',
            lineHeight: 1.5
          }}>
            {discussionTranscript.map((entry, idx) => (
              <div key={idx} style={{ marginBottom: 6 }}>
                <strong>{entry.speaker}</strong>{' '}
                <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>
                  {entry.tag}
                </span>
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Telemetry Row */}
        <div className="gd-live-telemetry-row">
          <div className="gd-telemetry-item">
            <div className="gd-telemetry-val" style={{ color: '#059669' }}>{interventionTimingScore}</div>
            <div className="gd-telemetry-lbl">Entry Timing</div>
          </div>
          <div className="gd-telemetry-item">
            <div className="gd-telemetry-val" style={{ color: '#2563eb' }}>{constructiveScore}%</div>
            <div className="gd-telemetry-lbl">Constructive Phrasing</div>
          </div>
          <div className="gd-telemetry-item">
            <div className="gd-telemetry-val" style={{ color: '#7c3aed' }}>{fillerWords} Detected</div>
            <div className="gd-telemetry-lbl">Filler Words</div>
          </div>
          <div className="gd-telemetry-item">
            <div className="gd-telemetry-val" style={{ color: '#0f172a' }}>{userSpeakingTime || 28}%</div>
            <div className="gd-telemetry-lbl">Your Floor Share</div>
          </div>
        </div>

        {/* Controls */}
        <div className="gd-modal-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isUserIntervening ? (
              <button 
                className="action-pill-btn" 
                style={{ background: '#dc2626', gap: 8, padding: '10px 20px', fontSize: 13 }}
                onClick={handleYieldFloor}
              >
                <Icon name="stop" size={16}/>
                <span>Yield Floor to Next Speaker</span>
              </button>
            ) : (
              <button 
                className="action-pill-btn" 
                style={{ background: '#059669', gap: 8, padding: '10px 20px', fontSize: 13 }}
                onClick={handleUserIntervene}
              >
                <Icon name="mic" size={16}/>
                <span>Intervene / Enter Discussion</span>
              </button>
            )}

            <button 
              className="btn-secondary" 
              style={{ padding: '9px 16px', fontSize: 12 }}
              onClick={() => {
                alert('Consensus Synthesis: You successfully summarized peer arguments and proposed a balanced conclusion (+10 points).');
              }}
            >
              <Icon name="spark" size={14}/> Synthesize Points
            </button>
          </div>

          <button 
            className="btn-primary" 
            style={{ background: '#0f172a', padding: '10px 18px', fontSize: 13 }}
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              alert('GD Simulation completed! Your multi-speaker communication telemetry has been recorded.');
              onComplete();
            }}
          >
            Finish &amp; View Rubric
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   ROOT APPLICATION COMPONENT
   ========================================================================== */
export default function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [timeframe, setTimeframe] = useState('2025 - 2026');
  const [activeModalScenario, setActiveModalScenario] = useState(null);
  const [activeAIMockModal, setActiveAIMockModal] = useState(false);
  const [activeGDModal, setActiveGDModal] = useState(false);

  return (
    <div className="voiceprint-app">
      {/* 1. Global Dark Top Bar (Branded voiceprint) */}
      <header className="portal-topbar">
        {/* Left: Brand Identity */}
        <div className="portal-brand">
          <div className="portal-logo-badge" title="voiceprint AI">
            <Icon name="mic" size={18} stroke={2.2}/>
          </div>
          <div className="portal-title-wrap">
            <div className="portal-name-row">
              <span className="portal-name">voiceprint</span>
              <span className="version-chip">v2.0</span>
            </div>
            <span className="portal-tagline">Communication &amp; Interview Intelligence</span>
          </div>
        </div>
      </header>

      {/* 2. Body Container with Mini-Sidebar (~68px) */}
      <div className="app-container">
        <aside className="mini-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item-btn ${activeNav === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveNav('overview')}
              title="Overview"
            >
              <Icon name="grid" size={18}/>
              <span>Overview</span>
            </button>

            <button
              className={`nav-item-btn ${activeNav === 'assessments' ? 'active' : ''}`}
              onClick={() => setActiveNav('assessments')}
              title="Assessments"
            >
              <Icon name="mic" size={18}/>
              <span>Assessments</span>
            </button>

            {/* Dedicated Job Prep Tab */}
            <button
              className={`nav-item-btn ${activeNav === 'jobprep' ? 'active' : ''}`}
              onClick={() => setActiveNav('jobprep')}
              title="Job Prep"
            >
              <Icon name="briefcase" size={18}/>
              <span>Job Prep</span>
            </button>

            <button
              className={`nav-item-btn ${activeNav === 'coaching' ? 'active' : ''}`}
              onClick={() => setActiveNav('coaching')}
              title="Coaching"
            >
              <Icon name="spark" size={18}/>
              <span>Coaching</span>
            </button>

            <button
              className={`nav-item-btn ${activeNav === 'progress' ? 'active' : ''}`}
              onClick={() => setActiveNav('progress')}
              title="Progress"
            >
              <Icon name="trend" size={18}/>
              <span>Progress</span>
            </button>

            <button
              className={`nav-item-btn ${activeNav === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveNav('reports')}
              title="Reports"
            >
              <Icon name="fileText" size={18}/>
              <span>Reports</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-foot-icon" title="Preferences & Microphone Settings">
              <Icon name="settings" size={18}/>
            </button>
          </div>
        </aside>

        {/* 3. Main Workspace Canvas Rendering Respective Tab Views */}
        <main className="main-workspace">
          {activeNav === 'overview' && (
            <OverviewView
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === 'assessments' && (
            <AssessmentsView onSelectScenario={(sc) => setActiveModalScenario(sc)}/>
          )}

          {activeNav === 'jobprep' && (
            <JobPrepView
              onLaunchInterview={() => setActiveAIMockModal(true)}
              onLaunchGDRoom={() => setActiveGDModal(true)}
            />
          )}

          {activeNav === 'coaching' && (
            <CoachingView
              onNavigate={setActiveNav}
              onLaunchDrill={(sc) => {
                setActiveNav('assessments');
                setActiveModalScenario(sc || scenarioData.executive);
              }}
            />
          )}

          {activeNav === 'progress' && (
            <ProgressView/>
          )}

          {activeNav === 'reports' && (
            <ReportsView/>
          )}
        </main>
      </div>

      {/* 4. Assessment Modal Overlay (5 Questions, Distraction-Free Flow) */}
      {activeModalScenario && (
        <AssessmentModal
          scenario={activeModalScenario}
          onClose={() => setActiveModalScenario(null)}
          onComplete={() => {
            alert(`Assessment "${activeModalScenario.title}" completed! 5 questions evaluated. Rubric & telemetry saved.`);
            setActiveModalScenario(null);
            setActiveNav('reports');
          }}
        />
      )}

      {/* 5. 1-on-1 AI Mock Interview Modal */}
      {activeAIMockModal && (
        <AIMockInterviewModal
          onClose={() => setActiveAIMockModal(false)}
          onComplete={() => {
            setActiveAIMockModal(false);
            setActiveNav('reports');
          }}
        />
      )}

      {/* 6. Group Discussion (GD) Simulator Modal */}
      {activeGDModal && (
        <AudioGDRoomModal
          onClose={() => setActiveGDModal(false)}
          onComplete={() => {
            setActiveGDModal(false);
            setActiveNav('reports');
          }}
        />
      )}

      {/* 7. Footer */}
      <footer className="portal-footer">
        <span>© 2025 voiceprint. All rights reserved.</span>
        <div className="portal-footer-links">
          <a href="#privacy">Privacy</a>
          <span>•</span>
          <a href="#terms">Terms</a>
          <span>•</span>
          <a href="#help">Help</a>
        </div>
      </footer>
    </div>
  );
}
