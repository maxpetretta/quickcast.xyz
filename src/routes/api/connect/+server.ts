import { error, json } from "@sveltejs/kit"
import { mnemonicToAccount } from "viem/accounts"

export async function POST() {
  // Check environment variables
  const {
    APP_FID: appFid,
    APP_MNEMONIC: appMnemonic,
    NEYNAR_API_KEY: neynarApiKey,
    NEYNAR_ENDPOINT: neynarEndpoint,
  } = process.env

  if (!appFid || !appMnemonic || !neynarApiKey || !neynarEndpoint) {
    throw new Error("Environment variables not set")
  }

  const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
    name: "Farcaster SignedKeyRequestValidator",
    version: "1",
    chainId: 10,
    verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
  } as const

  const SIGNED_KEY_REQUEST_TYPE = [
    { name: "requestFid", type: "uint256" },
    { name: "key", type: "bytes" },
    { name: "deadline", type: "uint256" },
  ] as const

  // Create signer via Neynar API
  let signerResponse
  try {
    const signerRequest = await fetch(`${neynarEndpoint}/signer`, {
      method: "POST",
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
      },
    })
    signerResponse = await signerRequest.json()
  } catch (e) {
    console.error(e)
    throw error(500, "Failed to create signer")
  }

  // Generate signature for signer
  const deadline = Math.floor(Date.now() / 1000) + 86400 // 1 day from now

  let signature
  try {
    const account = mnemonicToAccount(appMnemonic)

    signature = await account.signTypedData({
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: {
        SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
      },
      primaryType: "SignedKeyRequest",
      message: {
        requestFid: BigInt(appFid),
        key: signerResponse.public_key,
        deadline: BigInt(deadline),
      },
    })
  } catch (e) {
    console.error(e)
    throw error(500, "Failed to generate signature")
  }

  // Register signed key via Neynar API
  let signedKeyResponse
  try {
    const signedKeyRequest = await fetch(
      `${neynarEndpoint}/signer/signed_key`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          api_key: neynarApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          signer_uuid: signerResponse.signer_uuid,
          app_fid: appFid,
          deadline,
          signature,
        }),
      }
    )
    signedKeyResponse = await signedKeyRequest.json()
  } catch (e) {
    console.error(e)
    throw error(500, "Failed to register signed key")
  }

  // Return signer details to client
  const clientResponse = {
    status: 200,
    signerUuid: signerResponse.signer_uuid,
    deeplinkUrl: signedKeyResponse.signer_approval_url,
  }

  console.info("Successfully created signer:", clientResponse)
  return json(clientResponse)
}
