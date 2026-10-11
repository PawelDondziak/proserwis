export interface RepairRequest {
  name: string
  phone: string
  email?: string
  brand?: string
  model?: string
  issue: string
  description?: string
}

export async function submitRepairRequest(request: RepairRequest): Promise<void> {
  const endpoint = import.meta.env.VITE_REPAIR_REQUESTS_ENDPOINT?.trim()

  if (!endpoint) {
    throw new Error('Formularz nie jest jeszcze skonfigurowany. Skontaktuj się z serwisem telefonicznie lub e-mailowo.')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error('Nie udało się wysłać zgłoszenia. Spróbuj ponownie lub skontaktuj się z serwisem.')
  }
}
