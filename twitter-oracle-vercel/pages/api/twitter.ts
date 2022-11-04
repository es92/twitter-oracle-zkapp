import type { NextApiRequest, NextApiResponse } from "next";
import { 
  isReady, 
  PublicKey, 
  PrivateKey, 
  Field, 
  Signature,
  CircuitString,
} from "snarkyjs";

import { TwitterApi } from 'twitter-api-v2';

// Define the type that our function (and API) will return
type Data = {
  data: {
    id: string;
    str: string;
  };
  signature: Signature;
  publicKey: PublicKey;
};

// This is the serverless function that Vercel will run when this endpoint is
// queried
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // We need to wait for SnarkyJS to finish loading before we can do anything
  await isReady;

  // The private key of our account. When running locally the hardcoded key will
  // be used. In production the key will be loaded from a Vercel environment
  // variable.
  const privateKey = PrivateKey.fromBase58(
    process.env.PRIVATE_KEY ??
      "EKF65JKw9Q1XWLDZyZNGysBbYG21QbJf3a4xnEoZPZ28LKYGMw53"
  );

  const bearerToken = process.env.BEARER_TOKEN;

  const client = new TwitterApi(bearerToken);

  const tweetId = req.query.id;
  const tweet = await client.v2.get('tweets/' + tweetId);

  console.log('got tweet', tweet);

  const str = tweet.data.text;
  const id = tweet.data.id;

  const fields = CircuitString.fromString(id).toFields().concat(CircuitString.fromString(str).toFields());

  const publicKey = privateKey.toPublicKey();

  const signature = Signature.create(privateKey, fields);

  res.status(200).json({
    data: { id, str },
    signature: signature,
    publicKey: publicKey,
  });
}
