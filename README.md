# Quirky888 (Q888) Portfolio Website

A dynamic, premium portfolio website for Q888 built using **Astro**, **Tailwind CSS v4**, and **GSAP**. This project includes interactive showcase sections, dynamic canvas effects, and AI-powered chatbot assistants.

---

## 🛠️ Tech Stack

* **Framework:** [Astro](https://astro.build/) (Static Site Generator)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/vite` integration)
* **Animations:** [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)
* **Interactive Pan/Zoom:** [@panzoom/panzoom](https://github.com/timmywil/panzoom)
* **Serverless Functions:** [Netlify Functions](https://www.netlify.com/products/functions/)
* **AI Engine:** [OpenAI API](https://openai.com/) (powers the chatbots)

---

## 📂 Project Structure

Inside the repository, you will find the following key directories and files:

```text
q888-website/
├── netlify/
│   └── functions/            # Serverless endpoints for AI chatbots
│       ├── nar-chat.ts       # Kotiki-Nar chatbot backend
│       └── investor-chat.ts  # Investor chatbot backend
├── public/                   # Static assets (images, icons, configurations)
│   ├── images/
│   └── eden-stories.json     # Configuration/data for map stories
├── src/
│   ├── components/           # Astro & UI components (Hero, chatbots, sections)
│   ├── layouts/
│   │   └── Layout.astro      # Main page HTML layout
│   ├── pages/                # Site pages (Astro routing)
│   │   ├── index.astro       # Landing page (Main scroll container)
│   │   ├── qbag.astro        # Q-Bag page
│   │   ├── narmail.astro     # NarMail chatbot page
│   │   ├── president.astro   # President of the Galaxy page
│   │   ├── afterlife.astro   # Afterlife page
│   │   ├── overpriced.astro  # Overpriced stickers page
│   │   ├── map.astro         # Interactive Map page
│   │   └── copyright.astro   # Copyright info page
│   └── styles/
│       ├── global.css        # Global CSS stylesheet & Tailwind setup
│       └── tokens.css        # Color tokens & theme declarations
├── .env.example              # Template for environment variables
├── netlify.toml              # Netlify build & dev configuration
└── package.json              # Script and dependency manifest
```

---

## ⚙️ Environment Setup

To run the AI chatbot endpoints locally, copy `.env.example` to a new `.env` file and add your OpenAI API key:

```bash
cp .env.example .env
```

Define the following variable in `.env`:
* `OPENAI_API_KEY`: Your OpenAI API Secret Key.
* `ALLOWED_HOSTS` (Optional): Comma-separated list of allowed hostnames.

---

## 🧞 Development Commands

All commands are run from the root of the project:

| Command | Action |
| :--- | :--- |
| `npm install` | Installs project dependencies. |
| `npm run dev` | Starts the Astro local development server at `localhost:4321`. |
| `npm run dev:netlify` | Runs Astro + Netlify Functions locally (requires Netlify CLI). **Use this to test chatbots.** |
| `npm run build` | Runs Astro compiler checks and builds the production bundle into `./dist/`. |
| `npm run preview` | Previews the built production site locally. |
| `npm run audit` | Runs performance/SEO lighthouse audits locally. |

---

## 🤖 Chatbot Integration

The website contains two interactive chatbots:
1. **Kotiki-Nar Chatbot:** Accessible via the `/narmail` page and backed by the Netlify serverless endpoint at `netlify/functions/nar-chat.ts`.
2. **Investor Chatbot:** Built for the portfolio showcase and backed by `netlify/functions/investor-chat.ts`.

To test these chatbots locally, you must run `npm run dev:netlify` with a valid `OPENAI_API_KEY` set in your `.env` file.

---

## 📌 Page Routing Guidelines

The main sections of the website exist as a single-page continuous scroll (`#landing → #projects → #infocigan → #contact`). 

However, all primary entities and core products (e.g. Q-Bag, NarMail, Afterlife, President, Overpriced) are assigned **dedicated top-level URL routes** inside `src/pages/`. When adding new core entities or main sections, ensure they are given their own short, dedicated top-level `.astro` file inside `src/pages/` (e.g., `src/pages/my-new-product.astro`).
