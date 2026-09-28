# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, served with equal weight from the first screen:

- **Employers**: recruiters, e-commerce managers and brand owners hiring a Mercado Libre analyst / marketplace specialist in Argentina (Buenos Aires, remote or on-site). They scan fast, want proof of results and a clear profile, and often download the CV.
- **Sellers**: owners of Mercado Libre accounts (small to mid-size brands and distributors) who want to sell more or stop losing money. They arrive curious and skeptical, and are won by trying something useful for free (the publication audit, the live demo).

Secondary: the owner himself, who uses the private admin (ML Tracker, Mi carrera) daily to analyse client accounts and plan his career.

## Product Purpose

Personal portfolio and working toolset of Darío Colángelo, Mercado Libre analyst. It must get him (a) a job as an analyst in a brand or agency and (b) freelance clients, and later support his own import + Mercado Libre business. Success = conversations started: contact form / WhatsApp messages, CV downloads, audit and demo usage that ends in contact.

## Positioning

An analyst who also builds his own analysis tools and is training in international trade. Few profiles combine hands-on Mercado Libre results, a working tool connected to the official API (ML Tracker, with statistically validated diagnosis) and import knowledge. The site should prove it by letting visitors use the tools, not by claiming it.

## Operating Context

- Public site: CV/home, Lab ML (theory guides), Sistema (practice: method, live Tracker demo on a simulated account, diagnostic catalog, free publication audit, prompts), Programación lab, "Armá tu web", Contacto.
- Private admin: ML Tracker (accounts linked via OAuth, audits in PDF, competitor review miner), Mi carrera (profile with self-assessment and market prices, roadmap of tools/services, learning path, CV bullets), content editing, messages.
- Mercado Libre API reality: other sellers' listings are not readable (403); descriptions, reviews and catalog products (/p/) are. Public tools must be honest about this limit.
- Copy in Argentine Spanish with voseo.

## Capabilities and Constraints

- Stack: static HTML/CSS/vanilla JS + Node serverless functions on Vercel + MongoDB Atlas (shared cluster with another production site: never reconfigure it). Deploy via tools/build-deploy.py and Vercel CLI. Public repo on GitHub (AtrixDev/Portafolio-v1): private data lives in gitignored backend/lib/privado/.
- No prices on the public site (they live in the private admin only).
- Never criticise former employers publicly.
- Never use CSS class/ids starting with `ad-` or ad-like words (the owner browses with AdBlock).
- Vercel Hobby limit: 12 serverless functions (10 used).
- Public tools must be rate-limited (Mercado Libre API quota): 5 audits per person per day, 100 per day in total.

## Brand Commitments

- Voice: close, upbeat, confident Argentine Spanish ("buena onda" and sales-minded), never hype. Specific numbers over adjectives.
- Existing name/mark: "DC" monogram, "Darío Colángelo".
- Real photo of Darío in frontend/assets/foto-*.webp.

## Evidence on Hand

- Vení a la Cocina (jun–nov 2025): sales +38,9%, units +32,4%, ACOS 30% → 12% (panel captures in frontend/assets/resultados/, amounts blurred). The CV still says +39,2%: prefer 38,9% to match the captures.
- Borner case: same product, rebuilt listing (before/after in the home), https://www.mercadolibre.com.ar/p/MLA27077244.
- +1.800 publications created/optimised, +20 accounts managed, 3+ years.
- Certificates (Smartbeemo: Mercado Libre, Tienda Nube, Nubimetrics, Real Trends, Amazon Creative; UTN Full Stack) in frontend/assets/certificados/.
- Working tools: ML Tracker with public demo (/api/tracker?action=demo), diagnostic catalog (frontend/data/ia-meli.json), free audit (/api/audit).
- **No testimonials yet**: never invent quotes, clients, logos or user counts. Leave room for them.

## Product Principles

1. Show, don't claim: every capability on the page is something the visitor can try or verify.
2. Honest numbers only: real, sourced, consistent everywhere; hide confidential amounts.
3. Two doors, one story: employers and sellers each find their path from the first screen without a generic compromise.
4. Every page ends in a conversation: contact, WhatsApp, CV or audit.
5. Private stays private: self-assessment, prices and client data never reach the public site or repo.

## Accessibility & Inclusion

WCAG AA as the floor: keyboard access, visible focus, reduced motion respected, light and dark themes both legible.
