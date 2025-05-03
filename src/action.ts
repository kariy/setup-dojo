import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as os from 'os'

export async function run(): Promise<void> {
  try {
    // Install dojoup
    core.info('Installing dojoup...')
    await installDojoup()
    // Add dojo to PATH
    const dojoBinPath = path.join(os.homedir(), '.dojo', 'bin')
    // Add dojo to PATH
    const dojoupBinPath = path.join(os.homedir(), '.dojo', 'dojoup')

    core.addPath(dojoBinPath)
    core.info(`Added ${dojoBinPath} to PATH`)
    core.addPath(dojoupBinPath)
    core.info(`Added ${dojoupBinPath} to PATH`)

    // Get the version input
    const version = core.getInput('version')
    // Install the Dojo toolchain
    await installDojoToolchain(version)

    core.info('Dojo toolchain set up successfully')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function installDojoup(): Promise<void> {
  // Install dojoup using curl
  await exec.exec('curl', [
    '-L',
    'https://install.dojoengine.org',
    '-o',
    'dojoup-installer.sh'
  ])
  await exec.exec('bash', ['dojoup-installer.sh'])
}

async function installDojoToolchain(version?: string): Promise<void> {
  const args = ['install']

  if (version) {
    core.info(`Installing Dojo toolchain version: ${version}`)
    args.push(version)
  } else {
    core.info('Installing latest Dojo toolchain')
  }

  // Run dojoup install with the appropriate arguments
  const dojoupPath = path.join(os.homedir(), '.dojo', 'dojoup', 'dojoup')
  await exec.exec(dojoupPath, args)
}
