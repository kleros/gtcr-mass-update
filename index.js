const { getAddress } = require('ethers/utils')
const { ethers } = require('ethers')
const fetch = require('node-fetch')
const TextEncoder = require('text-encoder-lite').TextEncoderLite
const _GeneralizedTCR = require('@kleros/tcr/build/contracts/GeneralizedTCR.json')

if (!process.env.PROVIDER_URL)
  throw new Error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable'
  )

if (!process.env.CONTRACTS)
  throw new Error(
    'Contracts array not set. Please set the CONTRACTS environment variable'
  )

if (!process.env.WALLET_PRIVATE_KEY)
  throw new Error(
    'Wallet key not set. Please set the WALLET_PRIVATE_KEY environment variable'
  )

if (!process.env.NEW_EVIDENCE_DISPLAY_URI)
  throw new Error(
    'New evidence display interface URI not set. Please set the NEW_EVIDENCE_DISPLAY_URI environment variable'
  )

let contractAddresses
try {
  contractAddresses = JSON.parse(process.env.CONTRACTS)
  if (!Array.isArray(contractAddresses))
    throw new Error('CONTRACTS should be an array of checksummed addresses')

  // getAddress will throw if one of the addresses is not an ethereum address.
  contractAddresses = contractAddresses.map(addr => getAddress(addr))
} catch (err) {
  console.error('CONTRACTS should be an array of checksummed addresses')
  throw err
}

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

;(async () => {
  const successfullyUpdated = []
  const txReverted = []

  // The wallet can't set the nonce properly with multiple txes in parallel.
  // To get around this we send txes one after the other and handle nonces manually.
  let nonce = await signer.getTransactionCount()
  for (const address of contractAddresses) {
    const gtcr = new ethers.Contract(address, _GeneralizedTCR.abi, signer)
    console.info('Updating TCR at', address)

    // Get the latest meta evidence events.
    console.info(' Fetching current meta evidence...')
    const logs = (
      await provider.getLogs({ ...gtcr.filters.MetaEvidence(), fromBlock: 0 })
    )
      .slice(-2)
      .map(log => gtcr.interface.parseLog(log))

    const newMetaEvidenceFiles = (
      await Promise.all(
        logs.map(
          async ({ values: { _evidence } }) =>
            (await fetch(`${process.env.IPFS_GATEWAY}${_evidence}`)).json() // Download the meta evidence files.
        )
      )
    ).map(metaEvidence => {
      // Update the evidence display URI
      metaEvidence.evidenceDisplayInterfaceURI =
        process.env.NEW_EVIDENCE_DISPLAY_URI
      return metaEvidence
    })

    console.info(' Uploading new meta evidence...')
    const [
      registrationMetaEvidenceURI,
      removalMetaEvidenceURI
    ] = await Promise.all(
      newMetaEvidenceFiles.map(async metaEvidence => {
        const fileData = new TextEncoder('utf-8').encode(
          JSON.stringify(metaEvidence)
        )
        const buffer = Buffer.from(fileData)
        const ipfsResponse = await fetch(`${process.env.IPFS_GATEWAY}/add`, {
          method: 'POST',
          body: JSON.stringify({
            fileName: 'meta-evidence.json',
            buffer
          }),
          headers: {
            'content-type': 'application/json'
          }
        })

        const ipfsObject = (await ipfsResponse.json()).data
        return `/ipfs/${ipfsObject[1].hash + ipfsObject[0].path}`
      })
    )

    console.info(' Sending tx with nonce', nonce)
    try {
      await gtcr.changeMetaEvidence(
        registrationMetaEvidenceURI,
        removalMetaEvidenceURI,
        {
          nonce
        }
      )
      successfullyUpdated.push(address)
      console.info(' Done.')
      nonce++
    } catch (err) {
      console.info(' Tx reverted. Continuing.')
      txReverted.push({ gtcr, err })
    }
  }

  console.info()
  console.info('Successfully updated TCRs')
  successfullyUpdated.forEach(address => console.info(`  ${address}`))

  console.info()
  console.info('Tx reverted TCRs')
  await Promise.all(
    txReverted.map(async ({ gtcr, err }) => {
      const governor = await gtcr.governor()
      console.info(`  ${gtcr.address}, Governor: ${governor}`)
      console.info(`    ${err.message}`)
    })
  )
})()
