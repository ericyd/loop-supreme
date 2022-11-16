// a simple wrapper around "console" so debug logs can be left in place
export const logger = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  error: console.error.bind(console),
  debug: (...args: unknown[]) => {
    if (new URLSearchParams(window.location.search).get('debug') !== null) {
      console.debug(...args)
    }
  },
}
