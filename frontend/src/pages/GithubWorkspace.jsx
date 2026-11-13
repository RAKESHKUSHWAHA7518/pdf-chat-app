import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/authContext";
import { API_URL, apiFetch, authHeaders, errorMessage } from "../api";

export default function GithubWorkspace() {
  const { auth } = useAuth();
  const [connection,setConnection]=useState(null),[repos,setRepos]=useState([]),[workspaces,setWorkspaces]=useState([]);
  const [selection,setSelection]=useState(""),[branch,setBranch]=useState(""),[consent,setConsent]=useState(false);
  const [current,setCurrent]=useState(null),[question,setQuestion]=useState(""),[messages,setMessages]=useState([]),[file,setFile]=useState(null);
  const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  const request=useCallback(async(path,options={})=>{
    const response=await apiFetch(`${API_URL}/repositories${path}`,{...options,headers:{...authHeaders(auth),"Content-Type":"application/json"}});
    const data=await response.json();if(!response.ok)throw new Error(errorMessage(data));return data;
  },[auth]);
  const load=useCallback(async()=>{
    const status=await request("/connection");setConnection(status);
    setWorkspaces((await request("/workspaces")).workspaces);
    if(status.login)setRepos((await request("/repositories")).repositories);
  },[request]);
  useEffect(()=>{const timer=setTimeout(()=>{if(auth)load().catch(err=>setError(err.message));},0);return()=>clearTimeout(timer);},[auth,load]);
  const currentId=current?.id;
  const importing=current?.status==="queued"||current?.status==="indexing";
  useEffect(()=>{
    if(!currentId||!importing)return;
    const controller=new AbortController();
    const timer=setInterval(()=>request(`/workspaces/${currentId}`,{signal:controller.signal}).then(setCurrent).catch(err=>{if(err.name!=="AbortError")setError(err.message);}),3000);
    return()=>{clearInterval(timer);controller.abort();};
  },[currentId,importing,request]);
  async function action(fn){setBusy(true);setError("");try{await fn();}catch(err){setError(err.message);}finally{setBusy(false);}}
  async function open(id){setCurrent(await request(`/workspaces/${id}`));setMessages([]);setFile(null);}
  if(!auth)return <div className="p-8">Please <Link to="/login">sign in</Link> to connect a private repository.</div>;
  const button="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-40";
  const input="rounded border border-slate-600 bg-slate-900 p-2 text-white";
  return <main className="p-6 space-y-6 text-slate-200 max-w-6xl mx-auto">
    <h1 className="text-2xl font-bold">GitHub Workspace</h1>
    <p>Understand your code with answers linked to files and lines at a specific commit. Read-only access; select the repositories this app may read.</p>
    {error&&<p role="alert" className="text-red-300">{error}</p>}
    {new URLSearchParams(window.location.search).get("connection")==="failed"&&<p role="alert">GitHub connection failed. Verify the App setup and try connecting again.</p>}
    {!connection?<p>Loading connection…</p>:<section className="space-y-3">
      {!connection.configured&&<p>The administrator must configure the GitHub Workspace App before connecting.</p>}
      {connection.installUrl&&<a className="underline block" href={connection.installUrl} target="_blank" rel="noreferrer">Install the read-only App and select repositories</a>}
      <button className={button} disabled={busy||!connection.configured} onClick={()=>action(async()=>{window.location.assign((await request("/oauth/url")).url);})}>{connection.login?`Reconnect ${connection.login}`:"Connect GitHub"}</button>
      {connection.login&&<button className={button+" ml-3"} disabled={busy} onClick={()=>action(async()=>{await request("/connection",{method:"DELETE"});setCurrent(null);setMessages([]);setFile(null);setRepos([]);await load();})}>Disconnect</button>}
    </section>}
    {connection?.login&&<form className="space-y-3" onSubmit={event=>{event.preventDefault();action(async()=>{const repo=repos[Number(selection)];const imported=await request("/workspaces",{method:"POST",body:JSON.stringify({...repo,branch:branch||repo.branch,consent})});setCurrent(imported);setMessages([]);setFile(null);await load();});}}>
      <label className="block">Repository <select required className={input+" ml-2"} value={selection} onChange={event=>{setSelection(event.target.value);setBranch(repos[Number(event.target.value)]?.branch||"");}}><option value="">Select repository</option>{repos.map((repo,i)=><option key={`${repo.installationId}-${repo.repositoryId}`} value={i}>{repo.name}</option>)}</select></label>
      <label className="block">Branch <input required className={input+" ml-2"} value={branch} onChange={event=>setBranch(event.target.value)} maxLength={200}/></label>
      <label className="block"><input type="checkbox" required checked={consent} onChange={event=>setConsent(event.target.checked)}/> I may share this source code with the configured AI provider for indexing and answers. Secret detection is best effort.</label>
      <p className="text-sm">Up to 3 workspaces. Daily limits: 3 import attempts and 100 questions. Imports include supported JS/TS/JSON/Markdown files within size limits.</p>
      <button className={button} disabled={busy||!consent||selection===""}>Import repository</button>
      {!repos.length&&<p>No accessible repositories. Install the App on a selected repository, then reconnect.</p>}
    </form>}
    <nav aria-label="Imported repositories" className="flex flex-wrap gap-3">{workspaces.map(workspace=><button className={button} disabled={busy||!connection?.login} key={workspace.id} onClick={()=>action(()=>open(workspace.id))}>{workspace.owner}/{workspace.repo}</button>)}</nav>
    {workspaces.map(workspace=><button className="text-sm underline mr-4" disabled={busy} key={workspace.id} onClick={()=>action(async()=>{await request(`/workspaces/${workspace.id}`,{method:"DELETE"});if(currentId===workspace.id){setCurrent(null);setMessages([]);setFile(null);}await load();})}>Delete local data: {workspace.repo}</button>)}
    {current&&<section className="space-y-4 border-t border-slate-700 pt-4">
      <h2 className="text-xl">{current.owner}/{current.repo} · {current.branch}</h2>
      <p role="status">Import status: {current.status} · Indexed files: {current.progress?.indexed||0} · Scanned: {current.progress?.scanned||0}</p>
      {current.error&&<p className="text-red-300">{current.error}</p>}
      <p className="break-all text-sm">Indexed commit: {current.indexedSha||"Not ready"}<br/>Last checked: {current.checkedAt?new Date(current.checkedAt).toLocaleString():"Not checked"}. Updates require Refresh in this version.</p>
      <button className={button} disabled={busy||importing} onClick={()=>action(async()=>{await request(`/workspaces/${currentId}/refresh`,{method:"POST"});await open(currentId);})}>Refresh from GitHub</button>
      {current.snapshot&&<details><summary>Import coverage and files ({current.snapshot.coverage.length})</summary>{current.snapshot.coverageTruncated&&<p>Coverage listing is truncated.</p>}<ul className="max-h-64 overflow-auto">{current.snapshot.coverage.map((row,i)=><li key={i}>{row.status==="indexed"?<button className="underline" onClick={()=>action(async()=>setFile(await request(`/workspaces/${currentId}/file?path=${encodeURIComponent(row.path)}`)))}>{row.path}</button>:<span>{row.path}: skipped — {row.reason}</span>}</li>)}</ul></details>}
      {file&&<details open><summary>{file.path} · {file.commitSha.slice(0,8)}</summary><pre className="max-h-80 overflow-auto text-xs bg-slate-950 p-3">{file.chunks.map(chunk=>`Lines ${chunk.startLine}–${chunk.endLine}\n${chunk.text}`).join("\n\n")}</pre></details>}
      <p className="text-sm">Ask a specific question about indexed files. Each question is independent; answers describe code evidence and may miss runtime behavior.</p>
      {messages.map((message,i)=><article key={i} className="rounded border border-slate-700 p-4 space-y-3"><p className="font-bold">{message.question}</p><p className="whitespace-pre-wrap">{message.answer}</p><p className="text-xs">Snapshot {message.commitSha}</p>{message.sources.map(source=><a className="block underline text-sm" key={source.id} href={source.url} target="_blank" rel="noreferrer">[{source.id}] {source.path}:{source.startLine}–{source.endLine}</a>)}</article>)}
      <form className="flex gap-3" onSubmit={event=>{event.preventDefault();action(async()=>{const result=await request(`/workspaces/${currentId}/chat`,{method:"POST",body:JSON.stringify({question})});setMessages(rows=>[...rows,{question,...result}]);setQuestion("");});}}><input aria-label="Question about repository" className={input+" flex-1"} maxLength={2000} required value={question} onChange={event=>setQuestion(event.target.value)} placeholder="How does authentication work?"/><button className={button} disabled={busy||!current.activeSnapshotId}>{busy?"Working…":"Ask"}</button></form>
    </section>}
  </main>;
}
