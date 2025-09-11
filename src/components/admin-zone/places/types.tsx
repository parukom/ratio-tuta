export type Place = {
    id: string
    teamId: string
    name: string
    description?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    country?: string | null
    timezone?: string | null
    currency?: string | null
    totalEarnings: number
    placeTypeId?: string | null
    createdAt: string
    isActive: boolean
    teamPeopleCount: number
}
