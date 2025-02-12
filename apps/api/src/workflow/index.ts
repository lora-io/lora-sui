import { Context, Trigger, TriggerConfig, TriggerType } from './types'
import { TelegramMessageTrigger } from './triggers/TelegramMessageTrigger'
import { DiscordMessageTrigger } from './triggers/DiscordMessageTrigger'
import { TwitterReplyTrigger } from './triggers/TwitterReplyTrigger'

export class Workflow {
  private readonly triggerConfig: TriggerConfig
  private trigger?: Trigger
  private context?: Context

  constructor(triggerConfig: TriggerConfig) {
    this.triggerConfig = triggerConfig
  }

  static async Start(config: TriggerConfig) {
    const workflow = new Workflow(config)
    const artifact = await workflow.start()
    return {
      message: {
        type: artifact.message?.type,
        text: artifact.message?.result.text,
      },
      twitter: {
        action: artifact.twitter?.action,
        text: artifact.twitter?.result.text,
        link: artifact.twitter?.link,
      },
    }
  }

  public async start() {
    // initialize context
    const { context, trigger } = await this.initialize()
    const { agent } = context

    // build tasks from trigger
    const tasks = await trigger?.buildTasks(context)
    if (!tasks) {
      throw new Error('No tasks found')
    }

    // execute tasks to generate actions
    for (const taskClass of tasks) {
      const task = new taskClass()
      console.info(`[Processor ${agent.name}] Executing task: ${task.constructor.name}`)
      const actions = await task.buildActions(context)

      if (actions) {
        for (const action of actions) {
          console.info(`[Processor ${agent.name}] Executing action: ${action.constructor.name}`)
          await action.execute(context)
        }
      }
    }

    return context.artifact
  }

  private async initialize() {
    const { type, payload } = this.triggerConfig
    switch (type) {
      case TriggerType.TelegramMessage:
        this.trigger = new TelegramMessageTrigger(payload)
        break
      case TriggerType.DiscordMessage:
        this.trigger = new DiscordMessageTrigger(payload)
        break
      case TriggerType.TwitterReply:
        this.trigger = new TwitterReplyTrigger(payload)
        break
      default:
        throw new Error(`Unsupported trigger type: ${type}`)
    }

    this.context = new Context(this.trigger)
    await this.context.loadPlugins()

    return {
      context: this.context,
      trigger: this.trigger,
    }
  }
}
