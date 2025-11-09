# Message Snitch

A Next.js application that analyzes conversation screenshots using AI to identify who was wrong, gave unsolicited advice, or was being rude.

## Features

- 📸 Upload screenshots of message conversations
- 🤖 AI-powered analysis using OpenAI GPT-4o
- 🎯 Identifies:
  - Who was wrong
  - Who gave unsolicited advice
  - Who was being rude
- 🎨 Beautiful UI built with Shadcn UI and Tailwind CSS
- 🌙 Dark mode support

## Tech Stack

- **Next.js 16** with App Router and Server Actions
- **TypeScript**
- **Tailwind CSS**
- **Shadcn UI**
- **OpenAI API** (GPT-4o)
- **Zod** for schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd snitch
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

You can get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click "Upload Screenshot" or drag and drop an image file
2. Select a screenshot of a conversation
3. Click "Analyze Screenshot"
4. View the analysis results showing who was wrong, gave unsolicited advice, or was being rude

## Project Structure

```
snitch/
├── app/
│   ├── actions/
│   │   └── analyze.ts          # Server action for AI analysis
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # Shadcn UI components
│   ├── screenshot-upload.tsx   # Upload component
│   └── analysis-results.tsx    # Results display component
├── lib/
│   └── utils.ts                # Utility functions
└── public/                     # Static assets
```

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)

## License

MIT
