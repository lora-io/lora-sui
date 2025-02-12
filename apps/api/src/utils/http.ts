import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { sleep } from './common'

export class HTTP {
  static async get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    options: AxiosRequestConfig<D> | undefined = undefined,
    isRetry = false,
  ): Promise<R> {
    try {
      return axios.get(url, options)
    } catch (error) {
      if (isRetry) {
        throw error
      }
      await sleep(5000)
      return HTTP.get(url, options, true)
    }
  }
}
