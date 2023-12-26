import { error, json } from "@sveltejs/kit"

export async function POST({ request }) {
  // Check environment variables
  const { NEYNAR_API_KEY: neynarApiKey, NEYNAR_ENDPOINT: neynarEndpoint } =
    process.env

  if (!neynarApiKey || !neynarEndpoint) {
    throw new Error("Environment variables not set")
  }

  // Get cast content from request
  const { uuid, content, parent } = await request.json()

  if (!uuid || !content) {
    console.error("Request body missing, uuid:", uuid)
    throw error(400, "Request body missing")
  }

  // Check for channel tag
  let channelId
  if (content.startsWith("/")) {
    channelId = content.substring(1).split(" ")[0].toLowerCase()
    let channelResponse
    try {
      const channelRequest = await fetch(
        `${neynarEndpoint}/channel/search?q=${channelId}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            api_key: neynarApiKey,
          },
        },
      )
      channelResponse = await channelRequest.json()

      if (!channelRequest.ok || channelId !== channelResponse.channels[0].id) {
        throw new Error(channelResponse.message)
      }
    } catch (e) {
      console.error(e)
      throw error(500, "Failed to get channel")
    }
  }

  // Write cast via Neynar API
  let castResponse
  try {
    const text = content.replace(`/${channelId}`, "").trim() // Remove channel tag from text
    const castRequest = await fetch(`${neynarEndpoint}/cast`, {
      method: "POST",
      headers: {
        accept: "application/json",
        api_key: neynarApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: uuid,
        text,
        parent,
        ...(channelId ? { channel_id: channelId } : {}), // Conditionally add channel_id
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

  console.info("Successfully sent cast:", castResponse.cast.hash)
  return json({ status: 200, hash: castResponse.cast.hash })
}
