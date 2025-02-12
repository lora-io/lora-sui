import { Context } from './context'

export abstract class Plugin {
  readonly name: string = this.constructor.name

  abstract execute(context: Context): Promise<void>
}

export abstract class PrePlugin extends Plugin {}

export abstract class PostPlugin extends Plugin {}
