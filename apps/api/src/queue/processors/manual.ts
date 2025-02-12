import { Job } from 'bull'
import { initLogger } from '../log'
import { ManualQueuePayload } from '../types'
import { ALL_TOOLS, ALL_TOOLS_NAMES } from '../../workflow/tools'
import { prisma } from '@repo/db'

export async function processManualJob(job: Job<ManualQueuePayload>) {
  initLogger(job)

  const { task } = job.data

  switch (task) {
    case 'tools':
      await updateTools()
      break
    default:
      throw new Error(`Unknown task: ${task}`)
  }
}

export async function updateTools() {
  for (const name of ALL_TOOLS_NAMES) {
    const tool = ALL_TOOLS[name]
    await prisma.agentTool.upsert({
      where: { name },
      update: {
        description: tool.description,
      },
      create: {
        name,
        description: tool.description ?? '',
        enabled: true,
        expireInSeconds: 0,
        url: '',
        method: '',
      },
    })
  }
}
