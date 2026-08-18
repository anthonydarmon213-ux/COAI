type LeadHubSpot = {
  email: string;
  telephone?: string;
};

const HUBSPOT_API = "https://api.hubapi.com";

async function hubspotFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("HUBSPOT_ACCESS_TOKEN non configuré");
  }

  return fetch(`${HUBSPOT_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
}

// Crée le contact s'il n'existe pas, ou complète sa fiche s'il est déjà
// connu. La recherche préalable évite le batch upsert par email, qui ne
// prend pas en charge les mises à jour partielles chez HubSpot.
export async function synchroniserLeadHubSpot({ email, telephone }: LeadHubSpot): Promise<void> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.warn("[hubspot] HUBSPOT_ACCESS_TOKEN absent, synchronisation ignorée");
    return;
  }

  const properties: Record<string, string> = {
    email,
    lifecyclestage: "lead",
  };
  if (telephone) properties.phone = telephone;

  const lookup = await hubspotFetch(
    `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`
  );

  let response: Response;
  if (lookup.ok) {
    const contact = (await lookup.json()) as { id: string };
    response = await hubspotFetch(`/crm/v3/objects/contacts/${contact.id}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  } else if (lookup.status === 404) {
    response = await hubspotFetch("/crm/v3/objects/contacts", {
      method: "POST",
      body: JSON.stringify({ properties }),
    });
  } else {
    throw new Error(`Recherche du contact refusée (${lookup.status}) : ${await lookup.text()}`);
  }

  if (!response.ok) {
    throw new Error(`Synchronisation du contact refusée (${response.status}) : ${await response.text()}`);
  }
}
