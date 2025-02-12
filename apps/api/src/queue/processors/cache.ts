import { Job } from 'bull'
import { initLogger } from '../log'
import { EmptyQueuePayload } from '../types'
import { ALL_QUEUES } from '../queue'

export async function processCacheJob(job: Job<EmptyQueuePayload>) {
  initLogger(job)

  // remove old jobs
  for (const queue of ALL_QUEUES) {
    const jobs = await queue.getCompleted()
    for (const job of jobs) {
      if (job.timestamp < Date.now() - 60 * 60 * 1000) {
        await job.remove()
      }
    }
  }
}
