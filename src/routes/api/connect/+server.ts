import { json } from '@sveltejs/kit';
import { mnemonicToAccount } from 'viem/accounts';

export async function POST() {
	// Check environment variables
	if (
		!process.env.APP_FID ||
		!process.env.APP_MNEMONIC ||
		!process.env.NEYNAR_API_KEY ||
		!process.env.NEYNAR_ENDPOINT
	) {
		throw new Error('Environment variables not set');
	}

	const appFid = process.env.APP_FID;
	const appMnemonic = process.env.APP_MNEMONIC;
	const neynarApiKey = process.env.NEYNAR_API_KEY;
	const neynarEndpoint = process.env.NEYNAR_ENDPOINT;

	const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
		name: 'Farcaster SignedKeyRequestValidator',
		version: '1',
		chainId: 10,
		verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553'
	} as const;

	const SIGNED_KEY_REQUEST_TYPE = [
		{ name: 'requestFid', type: 'uint256' },
		{ name: 'key', type: 'bytes' },
		{ name: 'deadline', type: 'uint256' }
	] as const;

	// Create signer via Neynar API
	let signerResponse;
	try {
		const signerRequest = await fetch(`${neynarEndpoint}/signer`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				api_key: neynarApiKey
			}
		});
		signerResponse = await signerRequest.json();
	} catch (error) {
		console.error(error);
		return json({ status: 500, error: 'Failed to create signer' });
	}

	// Generate signature for signer
	const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

	let signature;
	try {
		const account = mnemonicToAccount(appMnemonic);

		signature = await account.signTypedData({
			domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
			types: {
				SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE
			},
			primaryType: 'SignedKeyRequest',
			message: {
				requestFid: BigInt(appFid),
				key: signerResponse.public_key,
				deadline: BigInt(deadline)
			}
		});
	} catch (error) {
		console.error(error);
		return json({ status: 500, error: 'Failed to generate signature' });
	}

	// Register signed key via Neynar API
	let signedKeyResponse;
	try {
		const signedKeyRequest = await fetch(`${neynarEndpoint}/signer/signed_key`, {
			method: 'POST',
			headers: {
				accept: 'application/json',
				api_key: neynarApiKey,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				signer_uuid: signerResponse.signer_uuid,
				app_fid: appFid,
				deadline,
				signature
			})
		});
		signedKeyResponse = await signedKeyRequest.json();
	} catch (error) {
		console.error(error);
		return json({ status: 500, error: 'Failed to register signed key' });
	}

	// Return signer details to client
	const clientResponse = {
		status: 200,
		signer_uuid: signerResponse.signer_uuid,
		deeplink_url: signedKeyResponse.deeplink_url
	};

	console.info('Successfully created signer:', clientResponse);
	return json(clientResponse);
}
