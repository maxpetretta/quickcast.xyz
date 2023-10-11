import { error, json } from "@sveltejs/kit"
import { kv } from "@vercel/kv"

export async function GET({ url }) {
  // Check environment variables
  const { NEYNAR_API_KEY: neynarApiKey, NEYNAR_ENDPOINT: neynarEndpoint } =
    process.env

  if (!neynarApiKey || !neynarEndpoint) {
    throw new Error("Environment variables not set")
  }

  // Check status of given signer
  const uuid = url.searchParams.get("signer_uuid")

  let signerResponse
  try {
    const signerRequest = await fetch(
      `${neynarEndpoint}/signer?signer_uuid=${uuid}&api_key=${neynarApiKey}`,
    )
    signerResponse = await signerRequest.json()

    // Save signer response to kv
    if (signerResponse.status === "approved" && signerResponse.fid) {
      await kv.set(signerResponse.fid, signerResponse, { nx: true })
    }
  } catch (e) {
    console.error(e)
    throw error(500, "Failed to get signer connection status")
  }

  // Return status to the client
  const clientResponse = {
    status: 200,
    uuid: signerResponse.signer_uuid,
    ...(signerResponse.signer_approval_url
      ? { deeplink: signerResponse.signer_approval_url }
      : {}),
  }

  console.info("Successfully got signer status:", clientResponse)
  return json(clientResponse)
}
