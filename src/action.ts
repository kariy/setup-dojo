import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as path from 'path'
import * as os from 'os'

export async function run(): Promise<void> {
  try {
    // Install dojoup
    core.info('Installing dojoup...')
    await installDojoup()

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

/**
 * Installs the dojoup utility.
 * 
 * @returns {Promise<void>}
 */
export async function installDojoup(): Promise<void> {
  // Install dojoup using curl
  await exec.exec('curl', [
    '-L',
    'https://install.dojoengine.org',
    '-o',
    'dojoup-installer.sh'
  ])
  await exec.exec('bash', ['dojoup-installer.sh'])

  // Add dojoup bin to PATH
  const binPath = path.join(os.homedir(), '.dojo', 'dojoup')
  core.addPath(binPath)
}

/**
 * Installs the Dojo toolchain.
 * 
 * @param {string} version - The version to install. If empty, installs the latest version.
 * @returns {Promise<void>}
 */
export async function installDojoToolchain(version?: string): Promise<void> {
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

  const binPath = path.join(os.homedir(), '.dojo', 'bin')
  core.addPath(binPath)
}

/**
 * Verifies the installed Dojo toolchain version.
 * 
 * @param {string} expectedVersion - The version to verify.
 * @returns {Promise<boolean>} - True if the installed version matches the expected version.
 */
export async function verifyInstalledVersion(expectedVersion: string): Promise<boolean> {
  let installedVersion = ''
  
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        installedVersion += data.toString().trim()
      }
    }
  }
  
  const dojoupPath = path.join(os.homedir(), '.dojo', 'dojoup', 'dojoup')
  await exec.exec(dojoupPath, ['show'], options)
  
  return installedVersion === expectedVersion
}
