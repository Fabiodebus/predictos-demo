# Troubleshooting Letta Authentication

## Issue: Getting 401 Unauthorized Error

You're getting this error when trying to use your Letta agent:
```
Status code: 401 - Unauthorized
"You are attempting to access a resource that you don't have permission to access"
```

## Likely Causes & Solutions

### 1. **Verify API Key**
- Go to [app.letta.com/api-keys](https://app.letta.com/api-keys)
- Make sure your API key is active and not expired
- Copy the key exactly (should start with something like `yosk-let-`)
- Ensure no extra spaces or characters in `.env.local`

### 2. **Verify Agent ID**
- Go to [app.letta.com/agents](https://app.letta.com/agents) (or your Letta dashboard)
- Find your agent and copy its exact ID (should start with `agent-`)
- Make sure the agent belongs to the same account as your API key

### 3. **Check Environment File**
Your `.env.local` should look exactly like this:
```bash
LETTA_API_KEY=yosk-let-your-actual-key-here
LETTA_AGENT_ID=agent-your-actual-agent-id-here
EXA_API_KEY=your-exa-key-here
```

### 4. **Test Your Credentials**
You can test your Letta credentials by visiting:
```
http://localhost:3000/api/test-letta
```

This will attempt to list your agents and verify the connection.

## Quick Fix Steps

1. **Double-check your Letta Cloud credentials:**
   - Log into [app.letta.com](https://app.letta.com)
   - Verify you can see your agents
   - Generate a new API key if needed

2. **Update `.env.local` with fresh credentials:**
   - Copy the API key exactly
   - Copy the agent ID exactly
   - Restart the dev server: `npm run dev`

3. **Test the connection:**
   - Visit `http://localhost:3000/api/test-letta`
   - Should return success if credentials are correct

## Alternative: Create a New Agent

If your agent ID is incorrect, you can create a new one:

1. Go to [app.letta.com](https://app.letta.com)
2. Create a new agent with email generation capabilities
3. Copy the new agent ID to your `.env.local`
4. Restart the server

The agent should be configured for conversation and ideally have tools like web search enabled for best results.