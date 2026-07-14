import { eveChannel } from "eve/channels/eve"
import { localDev, type AuthFn } from "eve/channels/auth"
import { createServerClient } from "@supabase/ssr"

function supabaseAuth(): AuthFn<Request> {
    return async (request) => {
        const cookieHeader = request.headers.get("cookie") || ""
        const modelHeader = request.headers.get("x-model-name") || ""
        
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
                    setAll() {}
                }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        return {
            authenticator: "supabase",
            principalId: user.id,
            principalType: "user" as const,
            attributes: {
                modelName: modelHeader
            }
        }
    }
}

export default eveChannel({
    auth: [supabaseAuth(), localDev()]
})
