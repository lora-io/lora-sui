import { Job } from 'bull'

export function initLogger(job: Job): void {
  const originalLog = job.log
  const queueName = job.queue?.name ?? '_'

  job.log = async (text: string): Promise<void> => {
    await originalLog?.call(job, text)
    console.info(`[${queueName}] ${text}`)
  }
}
