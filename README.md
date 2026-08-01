# Lab Coach

SaaS fitness/wellness — Coaching, Suivi, IA. Fondé sur la méthode d'Anthony Darmon.

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
│   ├── (marketing)/     # landing publique, pricing
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
│       └── compte/{export,delete}/   # RGPD
├── components/{ui,programme,suivi,compte}/
├── lib/{ai,stripe,auth,whatsapp,db}/
└── middleware.ts
prisma/schema.prisma
```

## Décisions actées

1. IA conversationnelle : réutilisation du WhatsApp existant, pas de chat intégré à l'app
2. Authentification : Supabase Auth (managée), pas de développement custom
3. Programmes : génération dynamique par l'IA à chaque fois, pas de bibliothèque pré-construite

## Hors périmètre V1

Vidéos, suivi calories/macros détaillé, fonctionnalités sociales, B2B, app native.
