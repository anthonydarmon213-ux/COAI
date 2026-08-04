# YUMAI

HI × AI™ — AI generates. Humans validate.

L’expertise humaine augmentée par l’IA.

SaaS fitness/wellness — coach hybride, holistique. Coaching, Suivi, IA, supervisés par Anthony Darmon.

## Stack

- **Next.js 14** (App Router, TypeScript) — front + API routes dans un seul repo
- **Supabase** — Auth managée + PostgreSQL (région EU/Frankfurt, contrainte RGPD)
- **Prisma** — ORM / migrations
- **Stripe** — abonnement 49€/mois sans engagement
- **IA** — génération dynamique des programmes (pas de bibliothèque pré-construite)
- **WhatsApp** — aucune intégration de chat dans l'app : on s'appuie sur l'assistant
  existant "Coaching 2.0" (Make.com + Twilio) via des webhooks d'échange de données

## Démarrage

```bash
cp .env.example .env.local   # renseigner les clés Supabase/Stripe/IA/Make.com
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

## Structure

```
src/
├── app/
│   ├── (marketing)/     # landing publique, pricing (bouton Stripe Checkout)
│   ├── (auth)/           # sign-in / sign-up (Supabase Auth)
│   ├── (app)/             # espace abonné, protégé par middleware.ts
│   │   ├── dashboard/
│   │   ├── programme/          # programme généré dynamiquement (3 piliers)
│   │   ├── suivi/{seances,mesures,progression}/
│   │   └── compte/{abonnement,parametres}/
│   └── api/
│       ├── webhooks/{stripe,supabase,whatsapp}/
│       ├── programmes/generate/
│       ├── seances/ mesures/
│       ├── stripe/{checkout,portal}/
│       └── compte/{register,export,delete}/   # register + RGPD
├── components/{ui,programme,suivi,compte}/
├── lib/{ai,stripe,auth,whatsapp,db}/
└── middleware.ts
prisma/schema.prisma
```

## État de l'implémentation

Implémenté (logique métier) :
- Inscription/connexion Supabase Auth + création du `User` applicatif (`/api/compte/register`)
- Génération IA des 3 piliers via l'API Claude (`AI_API_KEY`/`AI_MODEL`), persistée en base
- Journal de séances et mesures (validation Zod, lecture/écriture)
- Abonnement Stripe : Checkout, portail client, webhook de synchronisation du statut
- RGPD : export JSON des données, suppression de compte (résiliation Stripe + Supabase Auth + cascade Prisma)

Reste à faire avant une V1 utilisable en prod :
- Créer le projet Supabase (région EU) et le compte Stripe, renseigner `.env.local`
- Lancer `npm run db:migrate` contre la base réelle
- Construire le scénario Make.com côté WhatsApp pour appeler `/api/webhooks/whatsapp`
- Design system / UI au-delà du strict nécessaire fonctionnel

## Décisions actées

1. IA conversationnelle : réutilisation du WhatsApp existant, pas de chat intégré à l'app
2. Authentification : Supabase Auth (managée), pas de développement custom
3. Programmes : génération dynamique par l'IA à chaque fois, pas de bibliothèque pré-construite

## Hors périmètre V1

Vidéos, suivi calories/macros détaillé, fonctionnalités sociales, B2B, app native.
