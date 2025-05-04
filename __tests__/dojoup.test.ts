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

import { installDojoup } from '../src/action'

describe('dojoup installation', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock homedir to return a known path
    jest.spyOn(os, 'homedir').mockImplementation(() => '/home/user')

    // Mock path.join to return predictable paths
    jest.spyOn(path, 'join').mockImplementation((...paths) => paths.join('/'))
  })

  test('should successfully install dojoup', async () => {
    // Define our mocks
    const execMock = exec.exec as jest.MockedFunction<typeof exec.exec>
    const addPathMock = core.addPath as jest.MockedFunction<typeof core.addPath>

    // Setup the mocks to resolve successfully
    execMock.mockResolvedValue(0)

    // Call the function
    await installDojoup()

    // Verify dojoup bin was added to PATH
    expect(addPathMock).toHaveBeenCalledWith('/home/user/.dojo/dojoup')
  })
})
