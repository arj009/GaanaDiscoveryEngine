# Gaana Vibe Search: Problem, Hypothesis, and Solution

## Hypothesis
**H1 + H2 Synthesis:** Discovery Seekers on Gaana — users who actively want to find new music — are stuck in a repetitive listening loop not because discovery features are absent, but because the existing discovery entry points (Trending and Made For You) are structurally blind to user intent. 

Trending serves popularity, and Made For You serves past pattern-matching, but neither allows a user to express what they actually want in their own language — mood, context, or vibe. This absence of an "intent layer" traps users in passive discovery loops, resulting in decision fatigue and a default to familiar, repetitive listening, or eventually abandoning the platform.

## Problem Statement
Gaana users who actively seek contextual music discovery are failing to find new music because the platform’s recommendation engine cannot interpret immediate, situational intent (e.g., mood, activity, vibe). 

*   **Root Cause:** The underlying architecture relies on passive algorithms (popularity and historical data) rather than an active intent layer that translates natural language into actionable, personalized discovery.
*   **Target User Segment:** "Discovery Seekers" — users who have specific, situational music cravings but lack the tools to articulate them within the app.
*   **Business Impact:** This gap leads to shorter session lengths, increased repetitive listening behavior, and user churn to competitors, directly undermining Gaana's strategic goal of increasing meaningful music discovery.

## Solution Detail: AI-Native MVP (Gaana Vibe Search)
To solve this, we are building **Gaana Vibe Search** — an AI intent layer built on top of the existing discovery surface. 

Instead of traditional keyword search or passive scrolling, users interact with a natural language input to describe their exact vibe (e.g., "Something raw and emotional but upbeat — not Bollywood, maybe Hindi indie or something regional"). 

### How it Works (MVP Architecture)
1.  **Intent Parser:** An AI layer (powered by Claude API) takes the user's natural language query and translates it into structured intent, capturing mood tags, energy, language preferences, and exclusion criteria.
2.  **Song Matching:** The structured intent is matched against a curated database of Indian tracks (simulated for the MVP).
3.  **Explainable UI:** The interface returns a targeted 6-song grid. Crucially, each track card features a generated one-line reasoning string (e.g., *"Because you want something raw and upbeat, this track has..."*) to explicitly bridge the gap between the user's input and the recommendation.

### Strategic Value
This MVP proves that the friction point in Gaana's discovery funnel is not the UI surface itself, but the lack of an intelligence layer capable of understanding contextual intent. By allowing users to speak their intent, we transition the user from passive consumers to active participants, effectively breaking the repetitive listening loop.
