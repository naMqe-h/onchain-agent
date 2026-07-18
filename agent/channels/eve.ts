import { eveChannel } from "eve/channels/eve"
import { localDev, type AuthFn } from "eve/channels/auth"
import { createServerClient } from "@supabase/ssr"
import { normalizeNetworkId } from "../../lib/web3/config"
import { normalizeTxConfirmationMode } from "../../lib/security"

function supabaseAuth(): AuthFn<Request> {
    return async (request) => {
        const cookieHeader = request.headers.get("cookie") || ""
        const modelHeader = request.headers.get("x-model-name") || ""
        const chatIdHeader = request.headers.get("x-chat-id") || ""
        const networkHeader = request.headers.get("x-active-network") || ""
        const walletHeader = request.headers.get("x-active-wallet") || ""
        const timeZoneHeader = request.headers.get("x-timezone") || ""

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        const list: { name: string; value: string }[] = []
                        cookieHeader.split(";").forEach(cookie => {
                            const parts = cookie.split("=")
                            const name = parts[0]?.trim()
                            const value = parts.slice(1).join("=").trim()
                            if (name && value) {
                                list.push({ name, value })
                            }
                        })
                        return list
                    },
                    setAll() { }
                }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const metaNetwork = user.user_metadata?.activeNetwork
        const rawNetwork =
            networkHeader ||
            (typeof metaNetwork === "string" ? metaNetwork : "")
        const activeNetwork = normalizeNetworkId(rawNetwork)
        const txConfirmationMode = normalizeTxConfirmationMode(
            user.user_metadata?.txConfirmationMode
        )

        const attributes: Record<string, string> = {
            modelName: modelHeader,
            chatId: chatIdHeader,
            activeNetwork,
            activeWalletAddress: walletHeader,
            txConfirmationMode,
            timeZone: timeZoneHeader,
        }

        return {
            authenticator: "supabase",
            principalId: user.id,
            principalType: "user" as const,
            attributes,
        }
    }
}

export default eveChannel({
    auth: [supabaseAuth(), localDev()]
})
