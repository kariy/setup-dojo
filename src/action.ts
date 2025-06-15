import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import * as os from 'os'

export type Input = {
  version?: string
}

export type Output = {
  version: string
}

export default async (options: Input): Promise<Output> => {
  try {
    core.info('Installing dojoup...')
    const dojoupPath = await installDojoup()
    const version = await installDojoToolchain(dojoupPath, options.version)
    core.info(`Dojo toolchain ${version} installed successfully`)
    return { version }
  } catch (error) {
    throw error
  }
}

export async function installDojoup(): Promise<string> {
  // Install dojoup using the installation script
  await exec.exec('curl', [
    '-L',
    'https://install.dojoengine.org',
    '-o',
    'dojoup-installer.sh'
  ])

  // Make the installer script executable
  await exec.exec('chmod', ['+x', 'dojoup-installer.sh'])
  
  // Run the installer script
  await exec.exec('./dojoup-installer.sh')

  const dojoupDirPath = join(os.homedir(), '.dojo', 'dojoup')
  const dojoupPath = join(dojoupDirPath, 'dojoup')
  
  if (!existsSync(dojoupPath)) {
    throw new Error(`dojoup binary not found at ${dojoupPath}. Installation may have failed.`)
  }
  
  // Add both dojoup and bin directories to PATH
  core.addPath(dojoupDirPath)
  core.addPath(join(os.homedir(), '.dojo', 'bin'))

  return dojoupPath
}

export async function installDojoToolchain(
  dojoupPath: string,
  version?: string
): Promise<string> {
  const args = ['install']

  if (version) {
    core.info(`Installing Dojo toolchain version: ${version}`)
    args.push(version)
  } else {
    core.info('Installing latest Dojo toolchain')
  }

  await exec.exec(dojoupPath, args)
  core.addPath(join(os.homedir(), '.dojo', 'bin'))

  return await getInstalledVersion(dojoupPath)
}

export async function getInstalledVersion(
  dojoupPath?: string
): Promise<string> {
  const path = dojoupPath || 'dojoup'

  let actualInstalledVersion = ''
  const stdout = (data: Buffer) => {
    const versionRegex = /version: ([^\s]+)/
    const versionMatch = data.toString().trim().match(versionRegex)
    if (versionMatch) {
      actualInstalledVersion += versionMatch[1]
    }
  }
  await exec.exec(path, ['show'], {
    listeners: {
      stdout
    }
  })

  return actualInstalledVersion
}
