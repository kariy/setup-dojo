import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { join } from 'node:path'
import * as os from 'os'

export type Input = {
  version?: string
}

export type Output = {
  version: string
}

export default async (options: Input): Promise<Output> => {
  try {
    core.startGroup('GitHub Action Environment Info')
    core.info(`OS: ${os.platform()}, release: ${os.release()}`)
    core.info(`Home directory: ${os.homedir()}`)
    core.info(`Current directory: ${process.cwd()}`)
    core.endGroup()

    core.startGroup('Installing dojoup')
    core.info('Starting dojoup installation process...')
    const dojoupPath = await installDojoup()
    core.endGroup()

    core.startGroup('Installing Dojo toolchain')
    const version = await installDojoToolchain(dojoupPath, options.version)
    core.endGroup()

    core.info(`Dojo toolchain ${version} installed successfully`)

    return { version }
  } catch (error) {
    core.setFailed(`Failed to install Dojo toolchain: ${error}`)
    throw error
  }
}

export async function installDojoup(): Promise<string> {
  // // Log current environment details
  // core.info(`Current user home directory: ${os.homedir()}`)
  // core.info(`Current working directory: ${process.cwd()}`)

  // // Ensure .dojo directories exist
  const dojoDir = join(os.homedir(), '.dojo')
  const dojoupDirPath = join(dojoDir, 'dojoup')
  const dojoBinPath = join(dojoDir, 'bin')

  // core.info("Creating necessary directories if they don't exist")
  // await exec.exec('mkdir', ['-p', dojoDir])
  // await exec.exec('mkdir', ['-p', dojoupDirPath])
  // await exec.exec('mkdir', ['-p', dojoBinPath])

  // Install dojoup using the installation script
  core.info('Downloading dojoup installer...')
  await exec.exec('curl', [
    '-L',
    'https://install.dojoengine.org',
    '-o',
    join(os.homedir(), 'dojoup-installer.sh')
  ])

  core.info('Running dojoup installer...')
  await exec.exec('bash', [join(os.homedir(), 'dojoup-installer.sh'), '-v'])

  core.info(`Checking if dojoup directory exists at: ${dojoupDirPath}`)

  // Check if the directory exists and log the result
  try {
    await exec.exec('ls', ['-la', os.homedir()])
    await exec.exec('ls', ['-la', join(os.homedir(), 'work')])
    await exec.exec('ls', ['-la', dojoDir])
    core.info('Directory listing for .dojo:')
    await exec.exec('ls', ['-la', dojoupDirPath])
    core.info('Directory listing for dojoup:')
  } catch (error) {
    core.warning(`Error listing directory: ${error}`)
  }

  // Add to PATH
  core.info(`Adding ${dojoupDirPath} to PATH`)
  core.addPath(dojoupDirPath)

  const dojoupPath = join(dojoupDirPath, 'dojoup')
  core.info(`Dojoup expected at: ${dojoupPath}`)

  return dojoupPath
}

export async function installDojoToolchain(
  dojoupPath: string,
  version?: string
): Promise<string> {
  // Check if dojoup exists
  try {
    core.info(`Checking if dojoup executable exists at: ${dojoupPath}`)
    await exec.exec('ls', ['-la', dojoupPath])
  } catch (error) {
    core.warning(`Dojoup executable not found at ${dojoupPath}: ${error}`)
    core.info('Trying to use dojoup from PATH instead')
    dojoupPath = 'dojoup'
  }

  const args = ['install']

  if (version) {
    core.info(`Installing Dojo toolchain version: ${version}`)
    args.push(version)
  } else {
    core.info('Installing latest Dojo toolchain')
  }

  core.info(`Running ${dojoupPath} with args: ${args.join(' ')}`)
  await exec.exec(dojoupPath, args)

  const dojoBinPath = join(os.homedir(), '.dojo', 'bin')
  core.info(`Adding Dojo bin directory to PATH: ${dojoBinPath}`)

  // Check if bin directory exists
  try {
    await exec.exec('ls', ['-la', dojoBinPath])
    core.info('Dojo bin directory exists')
  } catch (error) {
    core.warning(`Dojo bin directory not found: ${error}`)
  }

  core.addPath(dojoBinPath)

  return await getInstalledVersion(dojoupPath)
}

export async function getInstalledVersion(
  dojoupPath?: string
): Promise<string> {
  const path = dojoupPath || 'dojoup'
  core.info(`Getting installed version using: ${path}`)

  let actualInstalledVersion = ''
  let stdoutData = ''

  try {
    const stdout = (data: Buffer) => {
      const output = data.toString().trim()
      stdoutData += output
      core.info(`dojoup show output: ${output}`)

      const versionRegex = /version: ([^\s]+)/
      const versionMatch = output.match(versionRegex)
      if (versionMatch) {
        actualInstalledVersion += versionMatch[1]
        core.info(`Detected version: ${versionMatch[1]}`)
      }
    }

    const stderr = (data: Buffer) => {
      core.warning(`dojoup show stderr: ${data.toString().trim()}`)
    }

    await exec.exec(path, ['show'], {
      listeners: {
        stdout,
        stderr
      }
    })

    if (!actualInstalledVersion && stdoutData) {
      core.warning('Version regex did not match, trying alternative pattern')
      // Try another regex pattern in case the output format changed
      const altVersionRegex = /\b(\d+\.\d+\.\d+)\b/
      const altVersionMatch = stdoutData.match(altVersionRegex)
      if (altVersionMatch) {
        actualInstalledVersion = altVersionMatch[1]
        core.info(
          `Detected version using alternative pattern: ${actualInstalledVersion}`
        )
      }
    }

    if (!actualInstalledVersion) {
      core.warning(
        'Failed to extract version from output. Using fallback version.'
      )
      actualInstalledVersion = 'unknown'
    }
  } catch (error) {
    core.warning(`Error getting installed version: ${error}`)
    actualInstalledVersion = 'error'
  }

  return actualInstalledVersion
}
