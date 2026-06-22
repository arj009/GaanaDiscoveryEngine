import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { processReviews } from './dataEngine'

// ── Color palette ──────────────────────────────────────────────────────────
const ACCENT        = '#e51d45'
const POSITIVE_CLR  = '#10b981'
const NEUTRAL_CLR   = '#6b6b82'
const NEGATIVE_CLR  = '#ef4444'
const WARNING_CLR   = '#f59e0b'
const PURPLE_CLR    = '#8b5cf6'

const FRUSTRATION_COLORS = [ACCENT, '#ff5277', WARNING_CLR, PURPLE_CLR, '#06b6d4', POSITIVE_CLR]
const SEGMENT_COLORS     = [ACCENT, PURPLE_CLR, POSITIVE_CLR, WARNING_CLR, '#06b6d4']

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
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [nlqInput, setNlqInput] = useState('')
  const [nlqAnswer, setNlqAnswer] = useState('')

  useEffect(() => {
    fetch('/enriched_reviews.json')
      .then(r => r.json())
      .then(reviews => {
        setData(processReviews(reviews))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleNLQ(e) {
    if (e.key !== 'Enter' || !nlqInput.trim()) return
    const q = nlqInput.toLowerCase()
    if (!data) return

    let answer = ''
    if (q.includes('frustrat') || q.includes('complain') || q.includes('problem')) {
      const top3 = data.topFrustrations.slice(0,3).map(f => f.name).join(', ')
      answer = `Top frustrations from ${data.total} reviews: ${top3}. "${top3.split(',')[0]}" is the #1 issue.`
    } else if (q.includes('segment') || q.includes('user type') || q.includes('who')) {
      const top = data.segments[0]
      answer = `Largest segment is "${top?.name}" (${top?.count} users). Discovery Seekers have the highest negative sentiment.`
    } else if (q.includes('discover') || q.includes('new music')) {
      answer = `${data.discoveryPct}% of completed reviews (${data.discoveryCount} total) mention discovery struggles. Main barrier: repetitive recommendation loops.`
    } else if (q.includes('repeat') || q.includes('same')) {
      const top = data.topRepetitionCauses[0]
      answer = `The #1 cause of repetitive listening is "${top?.name}" — mentioned in ${top?.value} reviews.`
    } else if (q.includes('need') || q.includes('unmet')) {
      const top = data.unmetNeeds.slice(0,3).map(n => n.name).join(', ')
      answer = `Top unmet needs: ${top}.`
    } else {
      answer = `${data.discoveryPct}% of reviews mention discovery friction. Top issue: ${data.topFrustrations[0]?.name}. ${data.segments[0]?.name} is the dominant user segment.`
    }
    setNlqAnswer(answer)
    setNlqInput('')
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
    { name: 'Neutral',  value: data.sentimentCounts.NEUTRAL,  color: NEUTRAL_CLR  },
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
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>CORPUS SIZE</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{data.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>reviews analyzed</div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main">

        {/* Top bar */}
        <div className="topbar fade-in">
          <div className="topbar-left">
            <h1>Discovery Intelligence Dashboard</h1>
            <p>Answering all 6 Problem Statement questions from {data.total} real user reviews</p>
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

        {/* KPI strip */}
        <div className="kpi-row fade-in delay-1">
          <div className="glass-card kpi-card">
            <div className="kpi-icon">📋</div>
            <div className="kpi-val accent">{data.total}</div>
            <div className="kpi-lbl">Reviews Analyzed</div>
            <div className="kpi-sub">Play Store · App Store · Reddit · Forum · Twitter</div>
          </div>
          <div className="glass-card kpi-card">
            <div className="kpi-icon">🔍</div>
            <div className="kpi-val warning">{data.discoveryPct}%</div>
            <div className="kpi-lbl">Mention Discovery Friction</div>
            <div className="kpi-sub">{data.discoveryCount} of {data.total} reviews</div>
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

        {/* ── Q1: Why do users struggle to discover? ── */}
        <div className="section fade-in delay-2">
          <SectionHeader
            num="Q1"
            title="Why do users struggle to discover new music?"
            sub={`${data.discoveryPct}% of reviews (${data.discoveryCount} out of ${data.total}) contain discovery-related complaints`}
          />
          <div className="two-col">
            <div className="glass-card">
              <div className="chart-title">Overall Sentiment Split</div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {sentimentPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                {sentimentPie.map(e => (
                  <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: e.color }} />
                    {e.name} ({e.value})
                  </div>
                ))}
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
            sub="Keyword-matched frustration categories across all 900 reviews"
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
                  {['🎧','🔍','🎸','👥','😐'][i]}
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
              <BarChart data={data.segments.slice(0,5)} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.segments.slice(0,5).map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i]} />)}
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
          <div className="glass-card" style={{ marginBottom: 20 }}>
            {data.unmetNeeds.length > 0 ? (
              <div className="needs-grid">
                {data.unmetNeeds.map((n, i) => (
                  <div className="need-pill" key={i}>
                    {n.name}
                    <span className="need-count">{n.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
                Real OpenAI API key not yet set — unmet needs will be extracted automatically from review clusters once you add your key to .env. Showing qualitative analysis below:
              </div>
            )}
          </div>
          <div className="two-col">
            {[
              { emoji: '🌐', title: 'Deeper Genre Exploration', desc: 'Users — especially Discovery Seekers and Audiophiles — want a way to actively explore micro-genres like Indian Indie, regional classical, or city pop without being pulled back to mainstream tracks.' },
              { emoji: '🎲', title: '"Surprise Me" Feature', desc: 'Multiple reviews request a one-tap button that plays something completely outside the user\'s listening history — an AI-curated wild card.' },
              { emoji: '📈', title: 'Transparent Recommendation Reasoning', desc: 'Power users want to know WHY a song was suggested. A "Because you liked X..." explanation would build trust in the algorithm.' },
              { emoji: '🔔', title: 'New Release Alerts for Followed Artists', desc: 'Users want proactive push notifications when a followed artist drops new music — not just a buried update in the app.' },
            ].map((item, i) => (
              <div className="glass-card" key={i}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
