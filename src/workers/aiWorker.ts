import { Worker, Job } from 'bullmq';
import { logger } from '@/lib/logger';
import { QUEUE_NAME, getBullConnectionOptions, upsertAiScanRecord } from '@/lib/scan/queue';
import { analyzeWithAi, AiAnalysisRequest, AiAnalysisResult } from '@/lib/scan/aiAnalyzer';

const connection = getBullConnectionOptions();

const worker = new Worker<AiAnalysisRequest>(
  QUEUE_NAME,
  async (job: Job<AiAnalysisRequest>) => {
    const payload = job.data;
    let aiResult: AiAnalysisResult = {
      aiScore: null,
      aiStatus: 'skipped',
      aiReasons: ['Worker initialization'],
    };

    try {
      aiResult = await analyzeWithAi(payload);
    } catch (error) {
      logger.error({ err: error instanceof Error ? error.message : String(error), domain: payload.domain }, 'AI worker error');
    }

    try {
      await upsertAiScanRecord({
        domain: payload.domain,
        jobId: job.id as string,
        deterministicScore: payload.deterministicScore,
        heuristicScore: payload.heuristicScore,
        deterministicFlags: payload.deterministicFlags,
        heuristicReasons: payload.heuristicReasons,
        aiScore: aiResult.aiScore,
        aiStatus: aiResult.aiStatus,
        aiReasons: aiResult.aiReasons,
        aiSummary: aiResult.aiSummary ?? null,
      });
      logger.info({ domain: payload.domain, aiStatus: aiResult.aiStatus }, 'AI worker completed');
    } catch (persistError) {
      logger.error({ err: persistError instanceof Error ? persistError.message : String(persistError), domain: payload.domain }, 'Failed to persist AI result');
      throw persistError;
    }
  },
  { connection, concurrency: 1 }
);

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err?.message ?? 'unknown' }, 'AI job failed');
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'AI job completed');
});
