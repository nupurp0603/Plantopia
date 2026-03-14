# Plant Identification & Care App

## System Architecture Plan

---

# 1. Overview

This document describes the system architecture for the **Plant Identification & Care App**, a mobile application that allows users to:

* Identify plants using their phone camera
* Maintain a personal plant collection
* Receive care instructions and reminders
* Chat with an AI botanist for plant-related questions

The application is built using a **mobile-first architecture with AI-assisted services**, leveraging **React Native, Supabase, and Anthropic Claude models**.

---

# 2. High-Level Architecture

```
Mobile App (React Native + Expo)
        |
        |
API Layer (Supabase Edge Functions)
        |
        |
Supabase Platform
  ├─ Postgres Database
  ├─ Storage (plant images)
  ├─ Authentication
  └─ Scheduled Jobs
        |
        |
AI Services (Anthropic Claude)
  ├─ Plant Identification
  ├─ Care Instruction Generation
  └─ Botanist Chatbot
```

---

# 3. Technology Stack

## Frontend

* React Native
* Expo
* Expo Camera
* NativeWind / Tailwind
* TanStack Query
* Zustand (state management)
* React Navigation

## Backend

* Supabase

  * PostgreSQL database
  * Storage for images
  * Authentication
  * Edge functions

## AI Layer

Anthropic Claude models:

| Model         | Purpose                                  |
| ------------- | ---------------------------------------- |
| Claude Sonnet | Plant identification and care generation |
| Claude Opus   | AI botanist chat                         |

## Infrastructure

* Supabase (Singapore region)
* Edge Functions for AI API calls
* Cron jobs for reminder scheduling

---

# 4. Core Application Modules

## 4.1 Plant Library

Main screen displaying the user’s plants.

Capabilities:

* View saved plants
* Add new plants
* Access plant details
* Track plant care history

### Plant Library Flow

```
User scans plant
      ↓
Image uploaded to storage
      ↓
Claude identifies plant
      ↓
Plant data saved to database
      ↓
Displayed in plant library
```

---

## 4.2 Plant Identification Pipeline

### Step 1 — Capture Image

User scans plant using:

```
Expo Camera
```

### Step 2 — Upload Image

Image uploaded to:

```
Supabase Storage
```

### Step 3 — AI Identification

Supabase Edge Function sends image to Claude.

Claude returns:

```
{
  plant_name
  scientific_name
  watering_schedule
  light_requirement
  fertilizer_guidance
  common_problems
}
```

### Step 4 — Save Plant

Plant is stored in database and linked to user.

---

# 5. AI Botanist Chat System

Users can ask plant-related questions.

Example:

* "Why are my leaves turning yellow?"
* "How often should I water my monstera?"

### Chat Pipeline

```
User message
      ↓
Send plant context + question
      ↓
Claude Opus processes request
      ↓
Response returned to mobile app
      ↓
Stored in chat history
```

Chat context includes:

* Plant species
* Care instructions
* Plant history
* Optional plant photos

---

# 6. Reminder & Task System

Each plant generates recurring care tasks.

### Example Tasks

| Task      | Example         |
| --------- | --------------- |
| Water     | Every 3 days    |
| Fertilize | Every 30 days   |
| Repot     | Every 12 months |
| Rotate    | Every 7 days    |

### Task Flow

```
Plant added
      ↓
Care instructions generated
      ↓
Reminder tasks created
      ↓
Tasks appear in reminders screen
      ↓
User marks task completed
```

Reminders stored in the database.

Scheduled jobs can generate future tasks automatically.

---

# 7. Database Architecture

## Tables

### Users

```
users
- id
- email
- created_at
```

---

### Plants

```
plants
- id
- user_id
- plant_name
- scientific_name
- image_url
- created_at
```

---

### Plant Care

```
plant_care
- id
- plant_id
- watering_frequency_days
- light_requirement
- fertilizer_schedule
- care_instructions
```

---

### Tasks

```
tasks
- id
- plant_id
- task_type
- due_date
- completed
```

Task types:

* water
* fertilize
* repot
* rotate

---

### Chat Messages

```
chat_messages
- id
- user_id
- plant_id
- role
- message
- created_at
```

---

# 8. Mobile Application Structure

```
app
 ├── navigation
 │     BottomTabs.tsx
 │
 ├── screens
 │     PlantLibraryScreen.tsx
 │     ScanPlantScreen.tsx
 │     PlantDetailScreen.tsx
 │     ChatBotanistScreen.tsx
 │     RemindersScreen.tsx
 │
 ├── components
 │     PlantCard.tsx
 │     ScanButton.tsx
 │     CareGuide.tsx
 │     ReminderItem.tsx
 │
 ├── services
 │     supabaseClient.ts
 │     plantService.ts
 │     aiService.ts
 │
 ├── store
 │     plantStore.ts
 │
 └── hooks
       usePlants.ts
```

---

# 9. API Architecture

All AI interactions occur through **Supabase Edge Functions**.

### Edge Functions

#### Identify Plant

```
POST /identify-plant
```

Input:

```
image_url
```

Output:

```
plant_name
scientific_name
care_instructions
```

---

#### Generate Plant Care

```
POST /generate-care
```

Input:

```
plant_species
```

Output:

```
watering_schedule
light_requirement
fertilizer_guidance
```

---

#### Botanist Chat

```
POST /botanist-chat
```

Input:

```
plant_context
user_message
```

Output:

```
assistant_message
```

---

# 10. Multi-Agent Development Strategy (Cursor)

Multiple AI agents are used during development.

### Agent 1 — Mobile Architect

Responsible for:

* Navigation
* screen structure
* UI component architecture

---

### Agent 2 — Supabase Backend Engineer

Responsible for:

* Database schema
* Row-level security
* storage setup
* edge functions

---

### Agent 3 — AI Integration Engineer

Responsible for:

* Claude API integration
* prompt engineering
* structured responses

---

### Agent 4 — Vision Pipeline Engineer

Responsible for:

* Camera integration
* image uploads
* AI identification flow

---

### Agent 5 — Reminder System Engineer

Responsible for:

* task generation
* scheduling
* reminders UI

---

# 11. Development Phases

## Phase 1 — App Skeleton

* Expo setup
* navigation
* empty screens

---

## Phase 2 — Plant Scan

* camera integration
* image upload
* plant identification

---

## Phase 3 — Plant Library

* plant cards
* plant detail page
* care guide

---

## Phase 4 — AI Botanist

* chatbot UI
* Claude integration

---

## Phase 5 — Reminders

* task creation
* reminders screen
* completion tracking

---

# 12. Scalability Considerations

Future improvements may include:

* plant disease detection
* push notifications for reminders
* social plant sharing
* offline plant care data
* plant growth tracking
* ML-based plant recognition models

---

# 13. Success Metrics

Key product metrics:

* Plants scanned per user
* Daily active users
* Reminder completion rate
* Chatbot usage
* Average plant collection size

---

# 14. Summary

The architecture focuses on:

* **Mobile-first design**
* **AI-powered plant expertise**
* **Serverless backend infrastructure**
* **Rapid development using AI-assisted coding**

Using **React Native + Supabase + Claude**, the application can be developed quickly while maintaining scalability and maintainability.

---
