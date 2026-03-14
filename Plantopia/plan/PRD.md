# Plant Identification & Care App

## Updated Product Requirements Document (PRD)

---

# 1. Product Overview

The **Plant Identification & Care App** is a mobile application that helps users identify plants, manage their plant collection, and receive AI-powered care guidance.

Users can scan a plant using their smartphone camera. The system identifies the plant using AI and generates care instructions including watering schedules, light requirements, and fertilizer guidance.

The app also provides an **AI botanist chatbot** that allows users to ask plant-related questions and receive contextual care advice.

The goal of the product is to make plant care **simple, educational, and automated** for beginner and intermediate plant owners.

---

# 2. Product Goals

### Primary Goals

1. Enable users to quickly identify plants using a camera scan.
2. Help users maintain healthy plants through automated care reminders.
3. Provide AI-powered guidance for plant care issues.
4. Create a personal digital plant library.

### Success Criteria

* Users successfully identify plants within seconds.
* Users return to the app to manage plant care.
* Reminder completion rates improve plant maintenance habits.

---

# 3. Target Users

### Beginner Plant Owners

People new to plant care who need guidance and reminders.

### Home Gardeners

Users maintaining multiple indoor plants.

### Plant Enthusiasts

Users who enjoy learning about plant species and care.

---

# 4. Product Scope

## MVP Scope

The MVP will include:

* Plant identification via camera
* Personal plant library
* Plant detail pages with care instructions
* AI botanist chatbot
* Automated care reminders

## Out of Scope (Initial Release)

* Plant marketplace
* Social plant sharing
* Community plant database
* Offline plant recognition

---

# 5. Core Product Features

The app will include **three primary modules** accessible through a bottom navigation bar:

1. **Plant Library**
2. **Consult Botanist**
3. **Reminders & Tasks** 

---

# 6. Feature Details

---

# 6.1 Plant Library

The **Plant Library** serves as the main screen where users can manage their plant collection.

### Capabilities

* View all saved plants
* Scan a new plant
* Open plant details
* Track plant care history

### Plant Card Information

Each plant card displays:

* Plant image
* Plant name
* Last watering date
* Next task reminder

---

# 6.2 Add Plant Flow

Users can add plants through the camera scanning feature.

### Flow

1. User taps **Scan Plant**
2. Camera opens
3. User captures plant image
4. Image is sent to backend AI service
5. AI identifies plant
6. User confirms plant
7. Plant is added to library

### Data Stored Per Plant

* Plant name
* Scientific name
* Photo
* Care instructions
* Watering schedule
* Light requirements
* Fertilizer guidance
* Common problems

---

# 6.3 Plant Detail Page

The plant detail page provides comprehensive information and care tools.

### Sections

#### Plant Overview

* Name
* Scientific name
* Photos
* Short description

#### Care Guide

* Watering schedule
* Sunlight requirements
* Fertilizer instructions

#### Troubleshooting

* Common diseases
* Leaf discoloration
* Pest issues

#### Care History

Tracks user interactions:

* Last watered
* Last fertilized
* Last repotted

#### Quick Actions

Users can:

* Mark plant as watered
* Mark plant as fertilized
* Update care activity

---

# 6.4 AI Botanist Chat

The chatbot acts as a **virtual plant expert**.

Users can ask plant-related questions such as:

* Why are my leaves turning yellow?
* How often should I water this plant?
* What fertilizer should I use?

### AI Context

The chatbot receives:

* Plant species
* Plant care instructions
* Plant history
* Optional plant photos

The AI generates contextual answers using plant knowledge and user data.

---

# 6.5 Reminders & Tasks

The system automatically generates plant care tasks.

### Types of Tasks

* Water plant
* Fertilize plant
* Repot plant
* Rotate plant for sunlight

### Reminder Behavior

* Tasks appear in the **Reminders tab**
* Tasks show due date
* Users mark tasks as completed

### Example Task

```
Plant: Monstera
Task: Water
Due: Tomorrow
```

---

# 7. AI Capabilities

AI plays a central role in the application.

### Plant Identification

AI analyzes plant images to determine species.

Output includes:

* Plant name
* Scientific name
* Confidence level

---

### Care Instruction Generation

AI generates plant care instructions tailored to the identified plant.

Includes:

* Watering frequency
* Sunlight requirements
* Fertilizer schedule

---

### AI Botanist Chat

AI answers plant care questions conversationally.

The system uses contextual plant information to provide personalized advice.

---

# 8. User Experience Flow

### New User Flow

1. User installs app
2. Opens plant scanner
3. Identifies first plant
4. Plant added to library
5. Care reminders generated

---

### Returning User Flow

1. Open plant library
2. Check reminders
3. Perform plant care tasks
4. Ask AI botanist questions if needed

---

# 9. Technical Architecture (Overview)

### Frontend

* React Native
* Expo
* React Navigation

### Backend

* Supabase
* PostgreSQL database
* Supabase storage for images
* Edge functions for AI processing

### AI Services

* Claude Sonnet for plant identification
* Claude Opus for chatbot interactions

---

# 10. Data Model Overview

### Users

Stores user accounts.

### Plants

Stores plant metadata.

### Plant Care

Stores generated care instructions.

### Tasks

Stores reminder tasks.

### Chat Messages

Stores chatbot conversations.

---

# 11. Success Metrics

The following metrics will measure product success:

### Engagement

* Daily active users
* Average session duration

### Feature Usage

* Plants scanned per user
* AI chatbot usage

### Retention

* Weekly active users
* Returning users

### Behavioral Metrics

* Reminder completion rate
* Average plant collection size

---

# 12. Risks and Considerations

### AI Identification Accuracy

Incorrect plant identification may affect user trust.

Mitigation:

* Allow manual correction.

### Overuse of AI APIs

AI usage costs may increase with scale.

Mitigation:

* Cache plant data when possible.

### Reminder Fatigue

Too many reminders may cause users to ignore notifications.

Mitigation:

* Adjustable reminder settings.

---

# 13. Future Enhancements

Future product improvements may include:

* Push notifications for reminders
* Plant disease image detection
* Plant growth tracking
* Social plant community
* Plant marketplace
* Offline plant knowledge database

---

# 14. MVP Summary

The MVP will deliver a **simple but powerful plant care assistant** with:

* AI plant identification
* Personal plant library
* Care instructions
* Reminder system
* AI botanist chatbot

The system prioritizes **ease of use, automation, and intelligent plant care support**.

---
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