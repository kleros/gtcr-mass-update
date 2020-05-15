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
provider.pollingInterval = 60 * 1000
const signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

;(async () => {
  for (const address of contractAddresses)
    try {
      const gtcr = new ethers.Contract(address, _GeneralizedTCR.abi, signer)

      // Get the latest meta evidence events.
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
        delete metaEvidence.evidenceDisplayInterfaceHash
        metaEvidence.evidenceDisplayInterfaceURI =
          process.env.NEW_EVIDENCE_DISPLAY_URI
        return metaEvidence
      })

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

          if (ipfsResponse.status === 500) {
            console.error(ipfsResponse)
            throw new Error(`Internal error on IPFS endpoint`)
          }

          const ipfsObject = (await ipfsResponse.json()).data
          return `/ipfs/${ipfsObject[1].hash + ipfsObject[0].path}`
        })
      )

      const nonce = await signer.getTransactionCount()
      gtcr
        .changeMetaEvidence(
          registrationMetaEvidenceURI,
          removalMetaEvidenceURI,
          { nonce }
        )
        .then(() =>
          console.info('Done updating meta evidence for TCR at', address)
        )
        .catch(err =>
          console.warn('Transaction failed for TCR at', address, err)
        )
    } catch (err) {
      console.error(
        'Error: Failed to update evidence display URI of TCR at',
        address
      )
      console.error(err)
    }
})()
