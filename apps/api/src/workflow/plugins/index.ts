import { Plugin } from '../types/plugin'

const allPlugins: Plugin[] = []

export function getAgentPlugin(name: string) {
  return allPlugins.find((i) => i.name === name)
}
