import { tmpdir } from 'node:os'
import { getInput, setOutput, setFailed } from '@actions/core'
import run from './action.js'

if (!process.env.RUNNER_TEMP) {
  process.env.RUNNER_TEMP = tmpdir()
}

run({
  version: getInput('version') || undefined
})
  .then(({ version }) => {
    setOutput('version', version)
    process.exit(0)
  })
  .catch((error) => {
    setFailed(error)
    process.exit(1)
  })
