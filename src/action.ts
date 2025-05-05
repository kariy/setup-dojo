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

  const dojoupDirPath = join(os.homedir(), '.dojo', 'dojoup')
  await exec.exec('bash', ['dojoup-installer.sh'])
  core.addPath(dojoupDirPath)

  return join(dojoupDirPath, 'dojoup')
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
