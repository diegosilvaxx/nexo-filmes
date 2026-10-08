import axios, { type AxiosInstance } from 'axios';

export function createHttpClient(baseURL = '/api'): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 15_000,
    headers: { Accept: 'application/json' },
  });
}
