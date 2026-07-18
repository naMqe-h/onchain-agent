'use server'

import { createClient } from '@/lib/supabase/server'
import { getEnabledModelCatalog } from '@/lib/modelCatalog'
import { resolveUserModelPreferences, type UserModelPreferences } from '@/lib/modelPreferences'
import type { ChatModelOption } from '@/lib/models'

export async function fetchModelCatalog(): Promise<ChatModelOption[]> {
    return getEnabledModelCatalog()
}

export async function getUserModelPreferences(): Promise<UserModelPreferences> {
    const catalog = await getEnabledModelCatalog()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const prefs = resolveUserModelPreferences(catalog, {
        defaultModel: user?.user_metadata?.defaultModel as string | undefined,
        enabledModels: user?.user_metadata?.enabledModels as string[] | undefined,
    })

    if (user && prefs.didHeal && prefs.healedMetadata) {
        await supabase.auth.updateUser({
            data: {
                defaultModel: prefs.healedMetadata.defaultModel,
                enabledModels: prefs.healedMetadata.enabledModels,
            },
        })
    }

    return prefs
}
