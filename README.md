# AI-Powered Email Campaign Demo

A modern web application that demonstrates AI-powered email campaign generation using Exa API for company research and Letta Cloud for personalized email generation.

## Features

- 🔍 **Company Research**: Automated research using Exa API to gather relevant company information
- 🤖 **AI Email Generation**: Personalized email generation using your Letta Cloud agent
- 📊 **Transparent Process**: Real-time display of agent reasoning and decision-making
- 🎨 **Modern UI**: Clean, professional interface with components inspired by 21st.dev
- 🌙 **Dark Mode**: Full dark mode support
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Demo Workflow

1. **Campaign Setup**: Enter lead LinkedIn URL, company domain, search query, and campaign preferences
2. **Research Phase**: Exa API searches for relevant company information and recent news  
3. **AI Generation**: Letta agent analyzes research and generates personalized email
4. **Results Display**: View the complete process including agent reasoning and final email

## Prerequisites

Before running the application, ensure you have:

- Node.js 18+ and npm
- [Exa API key](https://exa.ai) for company research
- [Letta Cloud account](https://app.letta.com) with API key and agent ID

## Quick Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   
   Update `.env.local` with your API keys:
   ```bash
   # Letta Cloud Configuration
   LETTA_API_KEY=your_letta_api_key_here
   LETTA_AGENT_ID=your_agent_id_here
   
   # Exa API Configuration  
   EXA_API_KEY=your_exa_api_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## API Configuration

### Letta Cloud Setup

1. Create account at [app.letta.com](https://app.letta.com)
2. Generate API key at [app.letta.com/api-keys](https://app.letta.com/api-keys)
3. Create or identify your agent ID from the dashboard
4. Add both to your `.env.local` file

### Exa API Setup

1. Sign up at [exa.ai](https://exa.ai)
2. Generate your API key from the dashboard
3. Add to your `.env.local` file

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS variables
- **UI Components**: Custom components inspired by 21st.dev
- **Icons**: Lucide React
- **APIs**: Exa API for research, Letta Cloud for AI generation

## Important Notes

- This is a **demonstration application** - no emails are actually sent
- All generated emails should be reviewed before any real outreach
- API keys should never be committed to version control
- Rate limiting applies to both Exa and Letta APIs
