import { error, json } from "@sveltejs/kit"
import { kv } from "@vercel/kv"

export async function POST({ request }) {
  // Check environment variables
  const { NEYNAR_API_KEY: neynarApiKey, NEYNAR_ENDPOINT: neynarEndpoint } =
    process.env

  if (!neynarApiKey || !neynarEndpoint) {
    throw new Error("Environment variables not set")
  }

  // Get cast content from request
  const { signerUuid, content, parent } = await request.json()

  if (!signerUuid || !content) {
    console.error("Request body missing, signerUuid:", signerUuid)
    throw error(400, "Request body missing")
  }

  // Update the signer's connection status
  let signerResponse
  try {
    const signerRequest = await fetch(
      `${neynarEndpoint}/signer?signer_uuid=${signerUuid}&api_key=${neynarApiKey}`
    )
    signerResponse = await signerRequest.json()

    // Save signer response to kv
    if (signerResponse.status === "approved" && signerResponse.fid) {
      await kv.set(signerResponse.fid, signerResponse, { nx: true })
    }
  } catch (e) {
    console.error(e)
    throw error(500, "Failed to update signer connection status")
  }

  // Write cast via Neynar API
  let castResponse
  try {
    const castRequest = await fetch(`${neynarEndpoint}/cast`, {
      method: "POST",
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: content,
        parent,
      }),
    })
    castResponse = await castRequest.json()

    if (!castRequest.ok || !castResponse.cast.hash) {
      throw new Error(castResponse.message)
    }
  } catch (e) {
    console.error(e)
    throw error(500, "Unable to send cast")
  }

  return json({ status: 200, hash: castResponse.cast.hash })
}
