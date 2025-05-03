# Setup Dojo GitHub Action

[![GitHub Super-Linter](https://github.com/actions/javascript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

A GitHub Action to set up the [Dojo](https://dojoengine.org/) toolchain for use in your GitHub Actions workflows. 

## About Dojo

Dojo is the most elegant Cairo developer experience and onchain gaming engine. Dojo is built to help onchain game developers, providing easy-to-use, well-documented frameworks and tools that drastically reduce the complexity of game development on Starknet.

## Usage

Add this action to your workflow to install the Dojo toolchain:

```yaml
steps:
  - name: Checkout repository
    uses: actions/checkout@v4

  - name: Setup Dojo
    uses: dojoengine/setup-dojo@v1
    # Optionally specify a version:
    # with:
    #   version: 0.5.0
```

The action will:
1. Download and install the `dojoup` utility
2. Add the Dojo binaries to your PATH
3. Install the latest version of the Dojo toolchain (or the specified version)

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Version of Dojo to install | No | Latest stable version |

## Example Workflows

### Basic Workflow

```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Dojo
        uses: dojoengine/setup-dojo@v1
        
      - name: Build
        run: sozo build
        
      - name: Test
        run: sozo test
```

### Specific Version

```yaml
name: Build with Specific Version

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Dojo
        uses: dojoengine/setup-dojo@v1
        with:
          version: 0.5.0
          
      - name: Build
        run: sozo build
```

## Contributing

Contributions to improve this action are welcome! Please submit a pull request or open an issue to discuss changes.

## License

This project is licensed under the [MIT License](LICENSE).
