import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { processAggregatedData } from './dataEngine'

// ── Color palette ──────────────────────────────────────────────────────────
const ACCENT = '#e51d45'
const POSITIVE_CLR = '#10b981'
const NEUTRAL_CLR = '#6b6b82'
const NEGATIVE_CLR = '#ef4444'
const WARNING_CLR = '#f59e0b'
const PURPLE_CLR = '#8b5cf6'

const FRUSTRATION_COLORS = [ACCENT, '#ff5277', WARNING_CLR, PURPLE_CLR, '#06b6d4', POSITIVE_CLR]
const SEGMENT_COLORS = [ACCENT, PURPLE_CLR, POSITIVE_CLR, WARNING_CLR, '#06b6d4']

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'rgba(8,8,16,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    fontFamily: 'Outfit, sans-serif',
  },
  labelStyle: { color: '#f0f0f5' },
}

// ── Small reusable components ──────────────────────────────────────────────
function HBar({ data, colorFn }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return data.map((d, i) => (
    <div className="h-bar-item" key={i}>
      <div className="h-bar-label">
        <span>{d.name}</span>
        <span>{d.value}</span>
      </div>
      <div className="h-bar-track">
        <div
          className="h-bar-fill"
          style={{ width: `${(d.value / max) * 100}%`, background: colorFn ? colorFn(i) : ACCENT }}
        />
      </div>
    </div>
  ))
}

function SectionHeader({ num, title, sub }) {
  return (
    <div className="section-header">
      <div className="section-num">{num}</div>
      <div>
        <div className="section-title">{title}</div>
        {sub && <div className="section-sub">{sub}</div>}
      </div>
    </div>
  )
}

function SourceBadge({ source }) {
  const labels = { play_store: 'Play Store', app_store: 'App Store', reddit: 'Reddit', forum: 'Forum', twitter: 'Twitter' }
  return <span className="source-badge">{labels[source] || source}</span>
}

function StarRating({ rating }) {
  if (!rating) return null
  return <span className="star-row">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nlqInput, setNlqInput] = useState('')
  const [nlqAnswer, setNlqAnswer] = useState('')

  useEffect(() => {
    fetch('http://localhost:8000/api/insights')
      .then(r => r.json())
      .then(json => {
        setData(processAggregatedData(json.aggregated, json.unmetNeeds, json.classifiedReviews))
        setLoading(false)
      })
      .catch((err) => {
        console.warn('FastAPI backend not running, falling back to static JSON files:', err)
        Promise.all([
          fetch('/aggregated_insights.json').then(r => r.json()),
          fetch('/unmet_needs.json').then(r => r.json()),
          fetch('/reviews_classified.json').then(r => r.json())
        ])
        .then(([agg, unmet, classified]) => {
          setData(processAggregatedData(agg, unmet, classified))
          setLoading(false)
        })
        .catch(fallbackErr => {
          console.error('Fallback failed:', fallbackErr)
          setLoading(false)
        })
      })
  }, [])

  async function handleNLQ(e) {
    if (e.key !== 'Enter' || !nlqInput.trim()) return
    const query = nlqInput
    setNlqInput('')
    setNlqAnswer('Thinking...')

    try {
      const res = await fetch('http://localhost:8000/api/nlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      if (res.ok) {
        const data = await res.json()
        setNlqAnswer(data.answer)
      } else {
        throw new Error('API failed')
      }
    } catch (err) {
      // Fallback to basic keyword matching if FastAPI isn't running
      const q = query.toLowerCase()
      let answer = ''
      if (q.includes('frustrat') || q.includes('complain') || q.includes('problem')) {
        const top3 = data.topFrustrations.slice(0, 3).map(f => f.name).join(', ')
        answer = `Top frustrations from ${data.total} reviews: ${top3}. "${top3.split(',')[0]}" is the #1 issue.`
      } else if (q.includes('segment') || q.includes('user type') || q.includes('who')) {
        const top = data.segments[0]
        answer = `Largest segment is "${top?.name}" (${top?.count} users).`
      } else if (q.includes('discover') || q.includes('new music')) {
        answer = `${data.discoveryPct}% of completed reviews (${data.discoveryCount} total) mention discovery struggles.`
      } else {
        answer = `(Fallback) ${data.discoveryPct}% of reviews mention discovery friction. Start the FastAPI backend for real AI answers!`
      }
      setNlqAnswer(answer)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <span style={{ color: ACCENT }}>⏳</span> Loading review intelligence…
      </div>
    )
  }

  if (!data) {
    return (
      <div className="loading" style={{ flexDirection: 'column', gap: 8 }}>
        <span style={{ color: NEGATIVE_CLR }}>⚠️ Could not load enriched_reviews.json</span>
        <span style={{ fontSize: 14 }}>Make sure the API server is running and the file exists in /public</span>
      </div>
    )
  }

  const sentimentPie = [
    { name: 'Positive', value: data.sentimentCounts.POSITIVE, color: POSITIVE_CLR },
    { name: 'Neutral', value: data.sentimentCounts.NEUTRAL, color: NEUTRAL_CLR },
    { name: 'Negative', value: data.sentimentCounts.NEGATIVE, color: NEGATIVE_CLR },
  ]

  const segmentRadar = data.segments.slice(0, 5).map(s => ({
    subject: s.name.replace(' ', '\n'),
    count: s.count,
    negPct: s.negativePct,
  }))

  return (
    <div className="app-layout">

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-mark">🎵</div>
          <div>
            <div className="logo-text">Gaana AI</div>
            <div className="logo-sub">Discovery Intelligence</div>
          </div>
        </div>

        <div>
          <div className="nav-section-label">Problem Statement</div>
          <div className="nav-item active">📊 All Insights</div>
          <div className="nav-item">❓ Why Struggle to Discover</div>
          <div className="nav-item">😤 Top Frustrations</div>
          <div className="nav-item">🎧 Listening Behaviours</div>
          <div className="nav-item">🔁 Repetition Causes</div>
          <div className="nav-item">👥 Segment Challenges</div>
          <div className="nav-item">💡 Unmet Needs</div>
        </div>

        <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>DATA PIPELINE</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>1,096</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Scraped</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8, color: 'var(--accent)' }}>{data.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzed & Classified</div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main">

        {/* Top bar */}
        <div className="topbar fade-in">
          <div className="topbar-left">
            <h1>Discovery Intelligence Dashboard</h1>
            <p>Answering all 6 Problem Statement questions from high-signal user reviews</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, maxWidth: 480 }}>
            <div className="nlq-box">
              <span className="nlq-icon">✨</span>
              <input
                type="text"
                placeholder="Ask AI: 'Why do users struggle to discover?'"
                value={nlqInput}
                onChange={e => setNlqInput(e.target.value)}
                onKeyDown={handleNLQ}
              />
            </div>
            {nlqAnswer && (
              <div style={{ background: 'rgba(229,29,69,0.08)', border: '1px solid rgba(229,29,69,0.2)', borderRadius: 10, padding: '10px 16px', fontSize: 13, lineHeight: 1.5 }}>
                💬 {nlqAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Data Pipeline Overview */}
        <div className="glass-card fade-in delay-1" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>DATA PIPELINE OVERVIEW</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>1,123 <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)' }}>Total Scraped</span></div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span><b style={{color: '#fff'}}>695</b> Play Store</span>
              <span><b style={{color: '#fff'}}>386</b> App Store</span>
              <span><b style={{color: '#fff'}}>27</b> Reddit</span>
              <span><b style={{color: '#fff'}}>14</b> Medium Articles</span>
              <span><b style={{color: '#fff'}}>1</b> Twitter</span>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="kpi-row fade-in delay-1">
          <div className="glass-card kpi-card">
            <div className="kpi-icon">📋</div>
            <div className="kpi-val accent">{data.total}</div>
            <div className="kpi-lbl">High-Signal Reviews Analyzed</div>
            <div className="kpi-sub">Classified & Synthesized</div>
          </div>
          <div className="glass-card kpi-card">
            <div className="kpi-icon">🔍</div>
            <div className="kpi-val warning">{data.discoveryPct}%</div>
            <div className="kpi-lbl">Mention Discovery Friction</div>
            <div className="kpi-sub">{data.discoveryCount} of {data.total} analyzed</div>
          </div>
          <div className="glass-card kpi-card">
            <div className="kpi-icon">😤</div>
            <div className="kpi-val negative">{data.sentimentCounts.NEGATIVE}</div>
            <div className="kpi-lbl">Negative Reviews</div>
            <div className="kpi-sub">Top issue: {data.topFrustrations[0]?.name}</div>
          </div>
          <div className="glass-card kpi-card">
            <div className="kpi-icon">✅</div>
            <div className="kpi-val positive">{data.sentimentCounts.POSITIVE}</div>
            <div className="kpi-lbl">Positive Reviews</div>
            <div className="kpi-sub">Users who are happy with the app</div>
          </div>
        </div>

        {/* ── Q1: Is discovery friction a real problem? ── */}
        <div className="section fade-in delay-2">
          <SectionHeader
            num="Q1"
            title="Why do users struggle to discover new music? (Is Discovery Friction a Major Problem?)"
            sub={`${data.discoveryPct}% of reviews (${data.discoveryCount} out of ${data.total}) mention struggling to find new music`}
          />
          <div className="two-col">
            <div className="glass-card">
              <div className="chart-title">Discovery Friction vs Normal Listening</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20, padding: '0 20px' }}>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  A massive portion of our negative reviews stem directly from algorithmic loops rather than bugs or pricing. This validates our strategic goal.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ flex: 1, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${data.discoveryPct}%`, background: WARNING_CLR }} />
                    <div style={{ width: `${100 - data.discoveryPct}%`, background: POSITIVE_CLR }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: WARNING_CLR }}>{data.discoveryPct}% Experience Friction</span>
                  <span style={{ color: POSITIVE_CLR }}>{100 - data.discoveryPct}% Normal/Positive</span>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div className="chart-title">Evidence: Real User Reviews on Discovery</div>
              {data.evidenceReviews.length > 0
                ? data.evidenceReviews.slice(0, 3).map((r, i) => (
                  <div className="evidence-card" key={i}>
                    <div className="evidence-meta">
                      <SourceBadge source={r.source} />
                      <StarRating rating={r.rating} />
                    </div>
                    <div className="evidence-text">"{r.content}"</div>
                  </div>
                ))
                : <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No discovery-related negative reviews found with sufficient content length in the current dataset.</div>
              }
            </div>
          </div>
        </div>

        {/* ── Q2: Most common frustrations with recommendations ── */}
        <div className="section fade-in delay-2">
          <SectionHeader
            num="Q2"
            title="What are the most common frustrations with recommendations?"
            sub="GROQ-classified frustration categories across all reviews"
          />
          <div className="glass-card">
            {data.topFrustrations.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topFrustrations} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" stroke="var(--text-muted)" />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={180} tick={{ fontSize: 13 }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {data.topFrustrations.map((_, i) => <Cell key={i} fill={FRUSTRATION_COLORS[i % FRUSTRATION_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: 20 }}>
                No specific frustration keywords found in completed reviews yet. This will populate once real reviews with richer text are scraped.
              </div>
            )}
          </div>
        </div>

        {/* ── Q3: Listening behaviours ── */}
        <div className="section fade-in delay-3">
          <SectionHeader
            num="Q3"
            title="What listening behaviours are users trying to achieve?"
            sub="Detected from keyword patterns in review text"
          />
          <div className="glass-card">
            {data.topBehaviors.length > 0 ? (
              <>
                <HBar
                  data={data.topBehaviors}
                  colorFn={i => [ACCENT, PURPLE_CLR, POSITIVE_CLR, WARNING_CLR, '#06b6d4'][i % 5]}
                />
              </>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Listening behavior keywords (mood, chill, workout, etc.) not yet strongly present in the current dataset. The pattern will grow as more reviews are collected.
              </div>
            )}
          </div>
        </div>

        {/* ── Q4: Repetition causes ── */}
        <div className="section fade-in delay-3">
          <SectionHeader
            num="Q4"
            title="What causes users to repeatedly listen to the same content?"
            sub="Root causes extracted from repetition-related complaints"
          />
          <div className="two-col">
            <div className="glass-card">
              {data.topRepetitionCauses.length > 0 ? (
                <HBar
                  data={data.topRepetitionCauses}
                  colorFn={i => [NEGATIVE_CLR, WARNING_CLR, PURPLE_CLR, '#06b6d4'][i % 4]}
                />
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No repetition-related keywords detected yet in this dataset.</div>
              )}
            </div>
            <div className="glass-card">
              <div className="chart-title">Key Insight</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                {[
                  { emoji: '🔁', title: 'Algorithm Echo Chamber', desc: 'The recommendation engine over-fits to past listening history, creating a self-reinforcing loop of familiar content.' },
                  { emoji: '📂', title: 'Limited Content Exploration UI', desc: 'Users report no clear entry point to actively "explore" — there is no dedicated discovery mode that surfaces truly new content.' },
                  { emoji: '🎵', title: 'Autoplay Behavior', desc: 'Autoplay defaults to related tracks from the same artist/genre, trapping users in a narrow listening bubble.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Q5: User segment challenges ── */}
        <div className="section fade-in delay-4">
          <SectionHeader
            num="Q5"
            title="Which user segments experience different discovery challenges?"
            sub="Segment breakdown with their frustration intensity (% negative reviews)"
          />
          <div className="three-col" style={{ marginBottom: 20 }}>
            {data.segments.slice(0, 5).map((seg, i) => (
              <div className="glass-card segment-card" key={i}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {['🎧', '🔍', '🎸', '👥', '😐'][i]}
                </div>
                <div className="seg-name">{seg.name}</div>
                <div className="seg-count" style={{ color: SEGMENT_COLORS[i] }}>{seg.count}</div>
                <div className="seg-neg">🔴 {seg.negativePct}% negative sentiment</div>
              </div>
            ))}
          </div>
          <div className="glass-card">
            <div className="chart-title">Segment Size Comparison</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.segments.slice(0, 5)} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.segments.slice(0, 5).map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Q6: Unmet needs ── */}
        <div className="section fade-in delay-5">
          <SectionHeader
            num="Q6"
            title="What unmet needs emerge consistently across reviews?"
            sub="Extracted by the LLM from the most critical negative and discovery-seeking reviews"
          />
          <div className="two-col">
            {data.unmetNeeds && data.unmetNeeds.length > 0 ? (
              data.unmetNeeds.map((item, i) => (
                <div className="glass-card" key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 28, marginBottom: 12 }}>💡</div>
                    <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--accent)' }}>Opportunity: {item.opportunity_score}/10</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 12 }}>{item.description}</div>
                  <div style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 6, borderLeft: '2px solid var(--accent)' }}>
                    "{item.example_phrase}"
                  </div>
                  <div style={{ marginTop: 12, fontSize: 11, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                    Primary Segment: {item.primary_segment} ({item.mention_pct}% mention rate)
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                Unmet needs are currently being synthesized. Please run the Phase D pipeline.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
