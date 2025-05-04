import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as os from 'os'
import * as path from 'path'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'

// Mock all the @actions modules
jest.mock('@actions/core')
jest.mock('@actions/exec')
jest.mock('os')
jest.mock('path')

import { run, verifyInstalledVersion } from '../src/action'

describe('Full Dojo setup integration', () => {
  let execMock: jest.MockedFunction<typeof exec.exec>
  let getInputMock: jest.MockedFunction<typeof core.getInput>
  let infoMock: jest.MockedFunction<typeof core.info>
  let addPathMock: jest.MockedFunction<typeof core.addPath>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock homedir to return a known path
    jest.spyOn(os, 'homedir').mockImplementation(() => '/home/test-user')

    // Mock path.join to return predictable paths
    jest.spyOn(path, 'join').mockImplementation((...paths) => paths.join('/'))

    // Setup our mocks
    execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
    getInputMock = core.getInput as jest.MockedFunction<typeof core.getInput>
    infoMock = core.info as jest.MockedFunction<typeof core.info>
    addPathMock = core.addPath as jest.MockedFunction<typeof core.addPath>

    // Default successful execution
    execMock.mockResolvedValue(0)
  })

  test('should install latest version when no version specified', async () => {
    // Setup input to return empty string (no version)
    getInputMock.mockReturnValue('')

    // Run the action
    await run()

    // Verify dojoup was installed
    expect(execMock).toHaveBeenCalledWith('curl', [
      '-L',
      'https://install.dojoengine.org',
      '-o',
      'dojoup-installer.sh'
    ])
    expect(execMock).toHaveBeenCalledWith('bash', ['dojoup-installer.sh'])

    // Verify dojoup was called to install latest version
    expect(execMock).toHaveBeenCalledWith(
      '/home/test-user/.dojo/dojoup/dojoup',
      ['install']
    )

    // Verify both paths were added
    expect(addPathMock).toHaveBeenCalledWith('/home/test-user/.dojo/dojoup')
    expect(addPathMock).toHaveBeenCalledWith('/home/test-user/.dojo/bin')

    // Verify success message
    expect(infoMock).toHaveBeenCalledWith('Dojo toolchain set up successfully')
  })

  test('should install specific version when version is provided', async () => {
    // Setup input to return a specific version
    const version = '0.5.0'
    getInputMock.mockReturnValue(version)

    // Run the action
    await run()

    // Verify dojoup was installed
    expect(execMock).toHaveBeenCalledWith('curl', expect.any(Array))
    expect(execMock).toHaveBeenCalledWith('bash', ['dojoup-installer.sh'])

    // Verify dojoup was called to install specific version
    expect(execMock).toHaveBeenCalledWith(
      '/home/test-user/.dojo/dojoup/dojoup',
      ['install', version]
    )

    // Verify both paths were added
    expect(addPathMock).toHaveBeenCalledWith('/home/test-user/.dojo/dojoup')
    expect(addPathMock).toHaveBeenCalledWith('/home/test-user/.dojo/bin')
  })

  test('should handle error during installation', async () => {
    // Setup input to return empty string
    getInputMock.mockReturnValue('')

    // Make curl fail
    execMock.mockRejectedValueOnce(new Error('curl failed'))

    // Mock the setFailed function
    const setFailedMock = core.setFailed as jest.MockedFunction<
      typeof core.setFailed
    >

    // Run the action
    await run()

    // Verify setFailed was called with the error message
    expect(setFailedMock).toHaveBeenCalledWith('curl failed')
  })

  test('should verify installed version correctly', async () => {
    // Setup a specific version to verify
    const expectedVersion = '0.5.0'

    // Mock the exec implementation to return the expected version
    execMock.mockImplementationOnce((command, args, options) => {
      if (options?.listeners?.stdout) {
        options.listeners.stdout(Buffer.from(expectedVersion))
      }
      return Promise.resolve(0)
    })

    // Call the verify function
    const result = await verifyInstalledVersion(expectedVersion)

    // Verify dojoup show was called
    expect(execMock).toHaveBeenCalledWith(
      '/home/test-user/.dojo/dojoup/dojoup',
      ['show'],
      expect.any(Object)
    )

    // Verify the result is true (versions match)
    expect(result).toBe(true)
  })
})
