import { Queue, Job } from 'bullmq';
import { RowDataPacket } from 'mysql2/promise';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import type { AiAnalysisRequest, AiStatus } from '@/lib/scan/aiAnalyzer';

export const QUEUE_NAME = 'ai-scan-jobs';
const AI_TABLE_NAME = 'ai_scan_results';

let aiQueue: Queue | null = null;
let tableInitialized = false;

function buildRedisOptions() {
  const raw = process.env.REDIS_URL;
  if (!raw) {
    throw new Error('REDIS_URL is not configured');
  }

  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

export function getBullConnectionOptions() {
  return buildRedisOptions();
}

export async function getAiQueue(): Promise<Queue> {
  if (aiQueue) return aiQueue;

  const connection = buildRedisOptions();
  aiQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86_400 },
    },
  });

  return aiQueue;
}

export interface AiScanJobData extends AiAnalysisRequest {}

export async function enqueueAiScanJob(payload: AiScanJobData): Promise<Job> {
  const queue = await getAiQueue();
  return queue.add('run-ai-scan', payload, {
    jobId: `${payload.domain}-${Date.now()}`,
    attempts: 1,
    priority: 10,
    backoff: { type: 'fixed', delay: 5_000 },
  });
}

async function ensureAiResultsTable(): Promise<void> {
  if (tableInitialized) return;
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${AI_TABLE_NAME} (
      id CHAR(36) PRIMARY KEY,
      domain VARCHAR(255) NOT NULL,
      job_id VARCHAR(255) DEFAULT NULL,
      deterministic_score DECIMAL(5,2) NOT NULL DEFAULT 0,
      heuristic_score DECIMAL(5,2) NOT NULL DEFAULT 0,
      deterministic_flags JSON NOT NULL,
      heuristic_reasons JSON NOT NULL,
      ai_score DECIMAL(5,2) DEFAULT NULL,
      ai_status ENUM('pending','ok','fallback','skipped') NOT NULL DEFAULT 'pending',
      ai_reasons JSON DEFAULT NULL,
      ai_summary TEXT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_ai_scan_domain (domain),
      INDEX idx_ai_scan_job (job_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  tableInitialized = true;
}

export interface AiScanRecordPayload {
  domain: string;
  jobId: string | null;
  deterministicScore: number;
  heuristicScore: number;
  deterministicFlags: string[];
  heuristicReasons: string[];
  aiScore: number | null;
  aiStatus: AiStatus;
  aiReasons?: string[];
  aiSummary?: string | null;
}

export interface AiScanRecord {
  domain: string;
  jobId: string | null;
  deterministicScore: number;
  heuristicScore: number;
  deterministicFlags: string[];
  heuristicReasons: string[];
  aiScore: number | null;
  aiStatus: AiStatus;
  aiReasons: string[];
  aiSummary: string | null;
  updatedAt: string;
}

export async function upsertAiScanRecord(payload: AiScanRecordPayload): Promise<void> {
  await ensureAiResultsTable();
  const db = getDb();

  const deterministicFlagsJson = JSON.stringify(payload.deterministicFlags ?? []);
  const heuristicReasonsJson = JSON.stringify(payload.heuristicReasons ?? []);
  const aiReasonsJson = JSON.stringify(payload.aiReasons ?? []);

  await db.execute(
    `
      INSERT INTO ${AI_TABLE_NAME} (
        id,
        domain,
        job_id,
        deterministic_score,
        heuristic_score,
        deterministic_flags,
        heuristic_reasons,
        ai_score,
        ai_status,
        ai_reasons,
        ai_summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        job_id = VALUES(job_id),
        deterministic_score = VALUES(deterministic_score),
        heuristic_score = VALUES(heuristic_score),
        deterministic_flags = VALUES(deterministic_flags),
        heuristic_reasons = VALUES(heuristic_reasons),
        ai_score = VALUES(ai_score),
        ai_status = VALUES(ai_status),
        ai_reasons = VALUES(ai_reasons),
        ai_summary = VALUES(ai_summary),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      crypto.randomUUID(),
      payload.domain,
      payload.jobId,
      payload.deterministicScore,
      payload.heuristicScore,
      deterministicFlagsJson,
      heuristicReasonsJson,
      payload.aiScore,
      payload.aiStatus,
      aiReasonsJson,
      payload.aiSummary ?? null,
    ]
  );
}

export async function fetchAiScanRecord(domain: string): Promise<AiScanRecord | null> {
  await ensureAiResultsTable();
  const db = getDb();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM ${AI_TABLE_NAME} WHERE domain = ? LIMIT 1`,
    [domain]
  );

  const record = rows[0];
  if (!record) {
    return null;
  }

  const deterministicFlags = Array.isArray(record.deterministic_flags)
    ? record.deterministic_flags
    : JSON.parse(record.deterministic_flags ?? '[]');
  const heuristicReasons = Array.isArray(record.heuristic_reasons)
    ? record.heuristic_reasons
    : JSON.parse(record.heuristic_reasons ?? '[]');
  const aiReasons = Array.isArray(record.ai_reasons)
    ? record.ai_reasons
    : JSON.parse(record.ai_reasons ?? '[]');

  return {
    domain: record.domain,
    jobId: record.job_id,
    deterministicScore: Number(record.deterministic_score),
    heuristicScore: Number(record.heuristic_score),
    deterministicFlags: deterministicFlags,
    heuristicReasons,
    aiScore: record.ai_score !== null ? Number(record.ai_score) : null,
    aiStatus: record.ai_status as AiStatus,
    aiReasons,
    aiSummary: record.ai_summary ?? null,
    updatedAt: record.updated_at,
  };
}
