import { createAuthClient } from "better-auth/react";

// better-authはデフォルトで現在のドメインを使用するため、baseURLは不要
export const authClient = createAuthClient();

export const { signIn, signUp, useSession, signOut } = authClient;

