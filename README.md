<p align="center">
  <b style="font-size: 32px;">Generalized TCR Mass evidence display URI update</b>
</p>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with Prettier"></a>
</p>

Target audience: Generalized TCR developers.

Sometimes, when developing a new evidence display interface, it is useful to update the meta evidence of multiple GTCR deployments at once. This tool does precisely that. Of course, the wallet provided must be the governor of the target GTCR.

## Prerequisites

- Tested on NodeJS version 10

## Get Started

1.  Clone this repo.
2.  Duplicate `.env.example`, rename it to `.env` and fill in the environment variables.
3.  Run `yarn` to install dependencies and then `yarn start` to run the tool.

## Other Scripts

- `yarn format` - Lint, fix and prettify all the project.
.js files with styled components and .js files.
- `yarn run cz` - Run commitizen.
