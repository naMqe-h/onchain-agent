'use server'

import { type ChatModelOption, type UserModelPreferences } from '@/types'
import { getEnabledModelCatalog } from '@/lib/modelCatalog'
import { resolveUserModelPreferences } from '@/lib/modelPreferences'
import { createClient } from '@/lib/supabase/server'

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
