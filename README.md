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

When working with multiple lists, updating just the evidence display can be very time consuming and error-prone. Instead of doing it manually you can use this tool.

There are two modes of operation:
1. GENERATE: Here the tool does not send transactions to the blockchain. Instead it generates the meta evidence
files, uploads it to ipfs and gives you the URIs.
2. SEND: In this mode the tool does everything.

You can set the operation mode via the `MODE` env variable.

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
