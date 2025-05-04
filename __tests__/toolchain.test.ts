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

import { installDojoToolchain } from '../src/action'

describe('Dojo toolchain installation', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock homedir to return a known path
    jest.spyOn(os, 'homedir').mockImplementation(() => '/home/user')

    // Mock path.join to return predictable paths
    jest.spyOn(path, 'join').mockImplementation((...paths) => paths.join('/'))
  })

  test('should install latest toolchain when no version specified', async () => {
    // Define our mocks
    const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
    const infoMock = core.info as jest.MockedFunction<typeof core.info>
    const addPathMock = core.addPath as jest.MockedFunction<typeof core.addPath>

    // Setup exec to resolve successfully
    execMock.mockResolvedValue(0)

    // Call the function with no version
    await installDojoToolchain()

    // Verify dojoup was called with just the install command
    expect(execMock).toHaveBeenCalledWith('/home/user/.dojo/dojoup/dojoup', [
      'install'
    ])

    // Verify the bin path was added to PATH
    expect(addPathMock).toHaveBeenCalledWith('/home/user/.dojo/bin')
  })

  test('should install specific version when provided', async () => {
    // Define our mocks
    const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
    const infoMock = core.info as jest.MockedFunction<typeof core.info>

    // Setup exec to resolve successfully
    execMock.mockResolvedValue(0)

    // Call the function with specific version
    const version = '1.4.0'
    await installDojoToolchain(version)

    // Verify dojoup was called with the install command and version
    expect(execMock).toHaveBeenCalledWith('/home/user/.dojo/dojoup/dojoup', [
      'install',
      version
    ])
  })

  test('should throw error if dojoup install fails', async () => {
    // Define our mocks
    const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>

    // Setup exec to reject with an error
    execMock.mockRejectedValueOnce(new Error('dojoup install failed'))

    // Expect the function to throw
    await expect(installDojoToolchain()).rejects.toThrow(
      'dojoup install failed'
    )
  })
})
