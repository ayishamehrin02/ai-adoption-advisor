'use client';

import { useState } from 'react';
import { sectors, getSector } from '../lib/sectors';
import { extractionSchema, intakeSchema, readyToConfirm, taskTypes, impacts, sensitivities, type Intake, type Task } from '../lib/schema';

const emptyIntake: Intake = { title: '', sector_id: 'it-services', business_summary: '', workflow: '' };
const labels: Record<string, string> = { classification: 'Sort or label information', extraction: 'Find specific information', summarization: 'Summarise information', drafting: 'Write a draft', reasoning: 'Analyse or solve a problem', other: 'Other' };
const blankTask = (): Task => ({ name: '', task_type: 'other', monthly_volume: null, minutes_per_task: null, error_impact: null, data_sensitivity: null, current_tools: [], extraction_confidence: 0, reasoning: 'Manually entered. No AI extraction confidence is available.' });

export default function IntakeForm() {
  const [input, setInput] = useState<Intake>(emptyIntake);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [stage, setStage] = useState<'intake' | 'review' | 'confirmed'>('intake');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sector = getSector(input.sector_id)!;
  function changeTask(index: number, patch: Partial<Task>) { setTasks(current => current.map((t, i) => i === index ? { ...t, ...patch } : t)); }
  async function extract(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (!intakeSchema.safeParse(input).success) { setError('Add a title and at least 30 characters describing your workflow.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to extract tasks.');
      const parsed = extractionSchema.parse(result);
      setTasks(parsed.tasks); setQuestions(parsed.follow_up_questions); setStage('review');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to extract tasks. Please try again.'); }
    finally { setBusy(false); }
  }
  function manual() {
    if (!intakeSchema.safeParse(input).success) { setError('Add a title and at least 30 characters describing your workflow first.'); return; }
    setTasks([blankTask()]); setQuestions([]); setStage('review'); setError('');
  }
  function download() {
    const file = new Blob([JSON.stringify({ version: 1, status: 'confirmed', intake: input, tasks: tasks.map(t => ({ ...t, user_confirmed: true })), follow_up_questions: questions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file); const link = document.createElement('a');
    link.href = url; link.download = 'workflow-draft.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="shell">
    <header><a className="brand" href="/" aria-label="AI Adoption Advisor home"><span className="brand-icon">↗</span> Adoption Advisor</a><span className="header-note">From everyday work to better decisions</span><span className="pill">Phase 2 · Intake</span></header>
    <main>
      <div className="intro"><p className="eyebrow">MAKE ROOM FOR BETTER WORK</p><h1>Start with the work.<br/><span>Find where AI fits.</span></h1><p>Tell us how a workflow happens today. We’ll break it into tasks you can check, edit and build on.</p></div>
      <nav className="steps" aria-label="Assessment progress"><span className={stage === 'intake' ? 'active' : ''}>01 <b>Describe your workflow</b></span><span className={stage === 'review' ? 'active' : ''}>02 <b>Review the tasks</b></span><span className={stage === 'confirmed' ? 'active' : ''}>03 <b>Confirm your draft</b></span></nav>
      <div className="workspace"><section className="panel">
        {stage === 'intake' ? <form onSubmit={extract}>
          <div className="section-heading"><div><p className="eyebrow">THE STARTING POINT</p><h2>What does your team do?</h2></div><span className="muted">About 3 minutes</span></div>
          <fieldset disabled={busy}>
            <label>Workflow name<input required maxLength={150} value={input.title} onChange={e => setInput({ ...input, title: e.target.value })} placeholder="e.g. Sorting incoming support tickets" /></label>
            <label>Your sector<select value={input.sector_id} onChange={e => setInput({ ...input, sector_id: e.target.value })}>{sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>A little about your team <span className="muted">(optional)</span><input maxLength={2000} value={input.business_summary} onChange={e => setInput({ ...input, business_summary: e.target.value })} placeholder="Team size, customers, and what you’re trying to improve" /></label>
            <label>Walk us through the workflow<textarea required minLength={30} maxLength={12000} rows={7} value={input.workflow} onChange={e => setInput({ ...input, workflow: e.target.value })} placeholder="What starts the work? What steps do people take? How often, how long, and which tools do they use? What happens if something goes wrong?" /><span className="hint">Include monthly volume and minutes per task if you know them. {input.workflow.length.toLocaleString()} / 12,000</span></label>
            <div className="notice">Describe the process without including real customer records, passwords or confidential content. Selecting “Break into tasks” sends this description to the configured AI provider through OpenRouter.</div>
            <div className="actions"><button className="primary" type="submit">{busy ? 'Breaking down your workflow…' : 'Break into tasks →'}</button><button type="button" className="secondary" onClick={manual}>Enter tasks myself</button></div>
          </fieldset>
        </form> : stage === 'review' ? <div>
          <div className="section-heading"><div><p className="eyebrow">CHECK BEFORE YOU PLAN</p><h2>Review your tasks</h2></div><span className="pill">{tasks.length} tasks</span></div>
          <p className="muted">AI can misunderstand your workflow. Correct each task and fill in every unknown field. Confidence describes extraction certainty, not whether AI is suitable.</p>
          {questions.length > 0 && <div className="notice"><strong>A few details to clarify</strong><ul>{questions.map((q, i) => <li key={i}>{q}</li>)}</ul><p>Use your answers to update the fields below. For other details, go back and add them to your description before extracting again.</p></div>}
          {tasks.map((task, index) => <article className="task" key={index}>
            <div className="section-heading"><span className="eyebrow">TASK {String(index + 1).padStart(2, '0')}</span><button className="text-button" onClick={() => setTasks(tasks.filter((_, i) => i !== index))}>Remove<span className="sr-only"> task {index + 1}</span></button></div>
            <label>Task name<input value={task.name} maxLength={200} onChange={e => changeTask(index, { name: e.target.value })} /></label>
            <label>Type of work<select value={task.task_type} onChange={e => changeTask(index, { task_type: e.target.value as Task['task_type'] })}>{taskTypes.map(t => <option key={t} value={t}>{labels[t]}</option>)}</select></label>
            <div className="field-grid"><label>Times per month<input type="number" min={0} max={100000000} step={1} placeholder="Unknown" value={task.monthly_volume ?? ''} onChange={e => changeTask(index, { monthly_volume: e.target.value === '' ? null : Number(e.target.value) })} /></label><label>Minutes each time<input type="number" min={0} max={999999.99} step="0.01" placeholder="Unknown" value={task.minutes_per_task ?? ''} onChange={e => changeTask(index, { minutes_per_task: e.target.value === '' ? null : Number(e.target.value) })}/></label></div>
            <div className="field-grid"><label>Impact of a mistake<select value={task.error_impact ?? ''} onChange={e => changeTask(index, { error_impact: e.target.value ? e.target.value as Task['error_impact'] : null })}><option value="">Choose impact</option>{impacts.map(v => <option key={v}>{v}</option>)}</select></label><label>Most sensitive data involved<select value={task.data_sensitivity ?? ''} onChange={e => changeTask(index, { data_sensitivity: e.target.value ? e.target.value as Task['data_sensitivity'] : null })}><option value="">Choose a category</option>{sensitivities.map(v => <option key={v}>{v}</option>)}</select></label></div>
            <label>Current tools <span className="muted">(separate with commas)</span><input value={task.current_tools.join(',')} onChange={e => changeTask(index, { current_tools: e.target.value.split(',') })} onBlur={() => changeTask(index, { current_tools: task.current_tools.map(v => v.trim()).filter(Boolean) })}/></label>
            <p className="confidence">Original extraction confidence: {Math.round(task.extraction_confidence * 100)}% · {task.reasoning}</p>
            {task.data_sensitivity && task.data_sensitivity !== 'none' && <p className="privacy">Sensitive {task.data_sensitivity} data: check access, consent and provider retention before using real records.</p>}
          </article>)}
          <button className="secondary" disabled={tasks.length >= 20} onClick={() => setTasks([...tasks, blankTask()])}>+ Add a task</button>
          {!readyToConfirm(tasks) && <p className="hint">Complete each task’s name, volume, duration, mistake impact and data category before confirming. Use valid, non-negative numbers.</p>}
          <div className="actions"><button className="primary" disabled={!readyToConfirm(tasks)} onClick={() => { setStage('confirmed'); setError(''); }}>I’ve reviewed these tasks →</button><button className="text-button" onClick={() => { setStage('intake'); setError(''); }}>Back to description</button></div>
        </div> : <div className="confirmation"><span className="checkmark">✓</span><p className="eyebrow">A CLEARER PICTURE OF YOUR WORK</p><h2>Your task draft is ready.</h2><p>You’ve reviewed {tasks.length} tasks for <strong>{input.title}</strong>.</p><div className="notice">This draft is held only in this tab. Download a copy before leaving. Scoring and a ranked roadmap arrive in Phase 3.</div><div className="actions"><button className="primary" onClick={download}>Download task draft</button><button className="secondary" onClick={() => setStage('review')}>Edit tasks</button></div></div>}
        {error && <p role="alert" className="error">{error}</p>}
        <p className="sr-only" role="status">{busy ? 'Extracting tasks, please wait.' : stage === 'review' ? 'Your tasks are ready for review.' : stage === 'confirmed' ? 'Your draft is confirmed.' : ''}</p>
      </section><aside><div className="aside-card"><p className="eyebrow">A GOOD PLACE TO START</p><h3>Think about work that repeats.</h3><p>For {sector.name.toLowerCase()}, that might include:</p><ul className="examples">{sector.typical_workflows.slice(0, 3).map(w => <li key={w.name}><strong>{w.name}</strong><span>{w.description}</span></li>)}</ul></div><div className="aside-card soft"><h3>Details that help</h3><ul>{sector.follow_up_questions.map(q => <li key={q}>{q}</li>)}</ul></div><details className="aside-card"><summary>Privacy considerations</summary><ul>{sector.compliance_notes.map(n => <li key={n}>{n}</li>)}</ul></details></aside></div>
      <footer><span>Clear assumptions. Explainable decisions.</span><span>Your draft stays in this tab until you download it.</span></footer>
    </main>
  </div>;
}
