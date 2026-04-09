import { Credentials, OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { getEnv, getGoogleRedirectUri } from "@/lib/env";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

function getOAuthClient(input?: Request | URL | string) {
  const env = getEnv();

  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri(input),
  );
}

export function buildGoogleAuthUrl(state: string, input?: Request | URL | string) {
  return getOAuthClient(input).generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent select_account",
    scope: GOOGLE_SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code: string, input?: Request | URL | string) {
  const client = getOAuthClient(input);
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function fetchGoogleProfile(tokens: Credentials) {
  const client = getOAuthClient();
  client.setCredentials(tokens);

  const oauth = google.oauth2({
    version: "v2",
    auth: client,
  });

  const { data } = await oauth.userinfo.get();

  if (!data.email) {
    throw new Error("Google did not return an email address.");
  }

  return {
    email: data.email.toLowerCase(),
    name: data.name ?? data.email,
  };
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();
  return credentials;
}

export function getGmailApi(tokens: Credentials) {
  const client = getOAuthClient();
  client.setCredentials(tokens);

  return google.gmail({
    version: "v1",
    auth: client,
  });
}
