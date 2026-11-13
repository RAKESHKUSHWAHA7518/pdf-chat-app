import crypto from "node:crypto";
import { collections, withTransaction } from "../../db/database.js";
import { ApiError } from "../../middleware/errorHandler.js";
import { env } from "../../config/env.js";
import { GeminiEmbeddings } from "../../lib/embeddings.js";
import { workspaceClient, allowedRepository } from "./connection.js";
import { codeChunks, skipReason, containsSecret } from "./source.js";
import { RepositoryStore } from "./store.js";
import { logger } from "../../lib/logger.js";

export async function reserveRepositoryBudget(userId, kind, limit) {
  const day = new Date().toISOString().slice(0,10);
  const field = `repositoryBudget.${kind}`;
  const result = await collections.users().updateOne({ _id:userId, $or:[{[`${field}.day`]:{$ne:day}},{[`${field}.count`]:{$lt:limit}}] }, [{$set:{[field]:{day,count:{$cond:[{$eq:[`$${field}.day`,day]},{$add:[{$ifNull:[`$${field}.count`,0]},1]},1]}}}}]);
  if (!result.modifiedCount) throw new ApiError(429,"REPOSITORY_QUOTA",`Daily ${kind} limit reached (${limit})`);
}

export async function authorizeWorkspace(userId, id, clientOverride) {
  const workspace = await collections.repoWorkspaces().findOne({ _id: id, userId });
  if (!workspace) throw new ApiError(404, "WORKSPACE_NOT_FOUND", "Workspace not found");
  const client = clientOverride || await workspaceClient(userId);
  await allowedRepository(client, workspace.installationId, workspace.repositoryId);
  return { workspace, client };
}
export function publicWorkspace(workspace) {
  const { _id:id, owner, repo, branch, status, activeSnapshotId, indexedSha, latestKnownSha, checkedAt, createdAt, progress, error } = workspace;
  return { id, owner, repo, branch, status, activeSnapshotId, indexedSha, latestKnownSha, checkedAt, createdAt, progress, error };
}
export async function queueImport(userId, selection) {
  const client = await workspaceClient(userId);
  const repo = await allowedRepository(client, selection.installationId, selection.repositoryId);
  await reserveRepositoryBudget(userId,"imports",3);
  const workspace = { _id: crypto.randomUUID(), userId, installationId: selection.installationId, repositoryId: repo.id, owner: repo.owner.login, repo: repo.name, branch: selection.branch || repo.default_branch, status: "queued", attempt: 0, progress: { scanned: 0, indexed: 0 }, createdAt: new Date() };
  await withTransaction(async session => {
    // Serialize imports by account so concurrent requests cannot exceed the workspace cap.
    await collections.users().updateOne({_id:userId},{$inc:{repositoryWorkspaceRevision:1}},{session});
    if(await collections.repoWorkspaces().countDocuments({userId},{session})>=3)throw new ApiError(409,"WORKSPACE_LIMIT","Keep up to three workspaces");
    await collections.repoWorkspaces().insertOne(workspace,{session});
  });
  return publicWorkspace(workspace);
}
export async function refreshWorkspace(userId, id) {
  await authorizeWorkspace(userId,id);
  await reserveRepositoryBudget(userId,"imports",3);
  const result = await collections.repoWorkspaces().updateOne({ _id:id, userId, status: { $nin:["queued","indexing"] } }, { $set: { status:"queued", attempt:0 }, $unset:{error:""} });
  if (!result.modifiedCount) throw new ApiError(409,"IMPORT_BUSY","Import is already running");
}
export async function runImport(workspace, client, embedder = new GeminiEmbeddings()) {
  const snapshotId = crypto.randomUUID();
  const controller = new AbortController(); const timer = setTimeout(()=>controller.abort(), 10*60000);
  const signal = controller.signal;
  const coverage = []; let bytes = 0, count = 0, scanned = 0, indexedFiles = 0;
  try {
    const request = { owner:workspace.owner, repo:workspace.repo, request:{signal} };
    const commit = (await client.rest.repos.getCommit({...request,ref:workspace.branch})).data;
    const sha = commit.sha;
    if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid commit snapshot");
    await collections.repoWorkspaces().updateOne({_id:workspace._id,leaseId:workspace.leaseId},{$set:{latestKnownSha:sha,checkedAt:new Date()}});
    const tree = (await client.rest.git.getTree({...request,tree_sha:commit.commit.tree.sha,recursive:"1"})).data;
    if (tree.truncated) throw new Error("Repository tree exceeds supported import limits; select a smaller repository");
    const store = new RepositoryStore(embedder,snapshotId);
    await collections.repoSnapshots().insertOne({_id:snapshotId,workspaceId:workspace._id,commitSha:sha,status:"indexing",createdAt:new Date(),embeddingModel:env.GEMINI_EMBEDDING_MODEL,parserVersion:"babel-v1"});
    for (const file of tree.tree) {
      signal.throwIfAborted();
      if (file.type !== "blob") continue;
      scanned++;
      let reason = file.mode === "120000" ? "symlink" : skipReason(file.path,file.size);
      if (indexedFiles >= 1000 || count >= 4000 || bytes >= 10*1024*1024) reason ||= "snapshot budget reached";
      if (reason) { if(coverage.length<2000)coverage.push({path:file.path,status:"skipped",reason}); continue; }
      const blob = (await client.rest.git.getBlob({...request,file_sha:file.sha})).data;
      if (blob.encoding !== "base64" || blob.size > 256*1024) { coverage.push({path:file.path,status:"skipped",reason:"unsupported or oversized blob"});continue; }
      const buffer = Buffer.from(blob.content,"base64");
      const text = buffer.toString("utf8");
      if (buffer.length > 256*1024 || bytes+buffer.length>10*1024*1024 || text.includes("\0") || text.split(/\r?\n/).some(line=>line.length>12000) || containsSecret(text)) { coverage.push({path:file.path,status:"skipped",reason:"binary, sensitive content or size budget"});continue; }
      const chunks = codeChunks(file.path,text,sha);
      if (count+chunks.length>4000) { coverage.push({path:file.path,status:"skipped",reason:"chunk budget"});continue; }
      if(chunks.length)await store.addDocuments(chunks,{signal,deadline:Date.now()+120000});
      count+=chunks.length;bytes+=buffer.length;indexedFiles++;
      coverage.push({path:file.path,status:"indexed",blobSha:file.sha,lines:text.split(/\r?\n/).length,chunks:chunks.length,parser:chunks[0]?.metadata.parser});
      await collections.repoWorkspaces().updateOne({_id:workspace._id,leaseId:workspace.leaseId},{$set:{progress:{scanned,indexed:coverage.filter(row=>row.status==="indexed").length,bytes,chunks:count}}});
    }
    if(!count)throw new Error("No eligible source text found");
    // Verify access again before publishing, so revocation during import cannot publish content.
    await allowedRepository(client,workspace.installationId,workspace.repositoryId);
    if(env.NODE_ENV!=="test") await workspaceClient(workspace.userId);
    if(env.NODE_ENV === "production") {
      const vector = await embedder.embedQuery("index dimension probe",{signal});
      await store.ensureIndex(vector.length);
    }
    const latest = (await client.rest.repos.getCommit({...request,ref:workspace.branch})).data.sha;
    await withTransaction(async session=>{
      const changed=await collections.repoWorkspaces().updateOne({_id:workspace._id,leaseId:workspace.leaseId},{$set:{activeSnapshotId:snapshotId,indexedSha:sha,latestKnownSha:latest,status:latest===sha?"current":"outdated",checkedAt:new Date(),progress:{scanned,indexed:coverage.filter(row=>row.status==="indexed").length,bytes,chunks:count}},$unset:{leaseId:"",leaseUntil:"",error:""}},{session});
      if(!changed.modifiedCount)throw new Error("Import superseded");
      await collections.repoSnapshots().updateOne({_id:snapshotId},{$set:{status:"completed",coverage,scanned,coverageTruncated:scanned>coverage.length,completedAt:new Date()}},{session});
      await collections.repoChunks().updateMany({sessionId:snapshotId},{$unset:{expiresAt:""}},{session});
      const previous = await collections.repoSnapshots().find({workspaceId:workspace._id,_id:{$ne:snapshotId}},{session,projection:{_id:1}}).toArray();
      await collections.repoChunks().deleteMany({sessionId:{$in:previous.map(item=>item._id)}},{session});
      await collections.repoSnapshots().deleteMany({workspaceId:workspace._id,_id:{$ne:snapshotId}},{session});
    });
  } catch (err) {
    await collections.repoChunks().deleteMany({sessionId:snapshotId});
    await collections.repoSnapshots().updateOne({_id:snapshotId},{$set:{status:"failed"}});
    await collections.repoWorkspaces().updateOne({_id:workspace._id,leaseId:workspace.leaseId},{$set:{status:"failed",error:"Import failed. Verify GitHub access, repository limits and model availability, then refresh."},$unset:{leaseId:"",leaseUntil:""}});
    logger.warn({workspaceId:workspace._id,errorType:err.name},"Repository import failed");
    throw err;
  } finally {clearTimeout(timer);}
}
let running=false;
export async function processRepositoryJob() {
  if(running)return;running=true;
  try {
    await collections.repoWorkspaces().updateMany({status:"indexing",leaseUntil:{$lt:new Date()},attempt:{$gte:3}},{$set:{status:"failed",error:"Import stopped after repeated interruptions. Refresh to retry."},$unset:{leaseId:"",leaseUntil:""}});
    const workspace=await collections.repoWorkspaces().findOneAndUpdate({$or:[{status:"queued"},{status:"indexing",leaseUntil:{$lt:new Date()}}],attempt:{$lt:3}},{$set:{status:"indexing",leaseId:crypto.randomUUID(),leaseUntil:new Date(Date.now()+11*60000)},$inc:{attempt:1}},{returnDocument:"after"});
    if(workspace){
      try { const {client}=await authorizeWorkspace(workspace.userId,workspace._id);await runImport(workspace,client); }
      catch {await collections.repoWorkspaces().updateOne({_id:workspace._id,leaseId:workspace.leaseId},{$set:{status:"failed",error:"Repository access or import is unavailable. Reconnect or refresh."},$unset:{leaseId:"",leaseUntil:""}});}
    }
  }finally{running=false;}
}
export function startRepositoryWorker(){ const timer=setInterval(()=>processRepositoryJob().catch(err=>logger.error({errorType:err.name},"Repository worker failed")),3000);timer.unref();return ()=>clearInterval(timer); }
