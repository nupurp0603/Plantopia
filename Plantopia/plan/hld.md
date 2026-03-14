# Plant Identification & Care App

## High-Level Design (HLD)

---

# 1. Introduction

This document describes the **High-Level Design (HLD)** for the **Plant Identification & Care App**, a mobile application that enables users to:

* Identify plants using the device camera
* Maintain a personal plant library
* Receive care instructions and reminders
* Interact with an AI botanist for plant care guidance

The system integrates **AI-powered plant recognition**, **cloud storage**, and **automated reminder generation** to provide an intelligent plant care assistant.

---

# 2. Goals and Objectives

### Primary Goals

1. Enable users to identify plants using an image.
2. Store and manage a personal plant collection.
3. Provide AI-generated plant care instructions.
4. Offer an AI chatbot for plant-related queries.
5. Generate automated reminders for plant care.

### Non-Goals (MVP Scope)

* Social features
* Marketplace for plants
* Multi-user plant collaboration
* Offline plant recognition models

---

# 3. System Overview

The system follows a **mobile-first serverless architecture**.

Major components:

* **Mobile Application**
* **Backend Platform**
* **AI Processing Layer**
* **Data Storage**
* **Notification & Reminder System**

---

# 4. System Architecture

```
+---------------------------------------------------+
|                Mobile Application                 |
|            (React Native + Expo)                  |
|                                                   |
|  - Plant Library                                  |
|  - Plant Scanner                                  |
|  - Botanist Chat                                  |
|  - Reminders                                      |
+----------------------|----------------------------+
                       |
                       |
                       v
+---------------------------------------------------+
|              API & Business Logic Layer           |
|             (Supabase Edge Functions)             |
|                                                   |
|  - Plant Identification Service                   |
|  - Care Instruction Generator                     |
|  - Botanist Chat Service                          |
|  - Reminder Generator                             |
+----------------------|----------------------------+
                       |
                       |
                       v
+---------------------------------------------------+
|                 AI Processing Layer               |
|                (Anthropic Claude)                 |
|                                                   |
|  - Plant Image Identification                     |
|  - Plant Care Knowledge Generation                |
|  - AI Botanist Chat                               |
+----------------------|----------------------------+
                       |
                       |
                       v
+---------------------------------------------------+
|                   Data Layer                      |
|                (Supabase Platform)                |
|                                                   |
|  - PostgreSQL Database                            |
|  - Supabase Storage (plant images)                |
|  - Authentication                                 |
|  - Scheduled Jobs                                 |
+---------------------------------------------------+
```

---

# 5. Technology Stack

## Mobile Application

| Technology            | Purpose                           |
| --------------------- | --------------------------------- |
| React Native          | Cross-platform mobile development |
| Expo                  | Development framework             |
| React Navigation      | Navigation system                 |
| NativeWind / Tailwind | Styling                           |
| TanStack Query        | Data fetching & caching           |
| Zustand               | Client-side state management      |
| Expo Camera           | Image capture                     |

---

## Backend Platform

| Technology              | Purpose              |
| ----------------------- | -------------------- |
| Supabase                | Backend-as-a-Service |
| PostgreSQL              | Application database |
| Supabase Storage        | Image storage        |
| Supabase Auth           | User authentication  |
| Supabase Edge Functions | API logic            |

---

## AI Layer

| Model         | Responsibility                         |
| ------------- | -------------------------------------- |
| Claude Sonnet | Plant identification + care generation |
| Claude Opus   | AI botanist chatbot                    |

---

# 6. Core System Components

## 6.1 Plant Library Module

The **Plant Library** is the main user interface displaying all plants added by the user.

### Responsibilities

* Display plant collection
* Allow plant scanning
* Access plant detail pages
* Track plant care history

### Data Stored

* Plant name
* Scientific name
* Photos
* Care instructions
* Watering schedule
* Light requirements
* Fertilizer guidance

---

## 6.2 Plant Identification Module

This module enables plant recognition from an image captured by the user.

### Workflow

1. User opens plant scanner.
2. Camera captures plant image.
3. Image is uploaded to cloud storage.
4. Backend service sends image to Claude.
5. Claude returns plant information.
6. Plant data is saved in the database.
7. Plant appears in the user's plant library.

### Output Data

* Plant name
* Scientific name
* Care instructions
* Watering schedule
* Light requirements
* Fertilizer guidance
* Common problems

---

## 6.3 Plant Detail Module

Displays detailed information about a specific plant.

### Key Features

* Plant overview
* Photo gallery
* Care instructions
* Disease troubleshooting
* Watering and fertilization history

### User Actions

* Mark plant as watered
* Mark plant as fertilized
* View upcoming tasks

---

## 6.4 AI Botanist Chat Module

Allows users to interact with an AI-powered plant expert.

### Capabilities

* Diagnose plant issues
* Provide plant care advice
* Answer plant-related questions

### Input

* User question
* Plant species
* Plant history
* Optional plant photo

### Output

* AI-generated guidance

---

## 6.5 Reminder & Task Module

Generates automated plant care tasks.

### Example Tasks

| Task      | Example Frequency |
| --------- | ----------------- |
| Water     | Every 3 days      |
| Fertilize | Monthly           |
| Repot     | Every 12 months   |
| Rotate    | Weekly            |

### Workflow

1. Plant added to system.
2. Care schedule generated.
3. Reminder tasks created.
4. Tasks displayed in reminders screen.
5. User marks tasks completed.

---

# 7. Data Architecture

## Key Entities

### Users

Stores user account information.

Attributes:

* user_id
* email
* created_at

---

### Plants

Stores plants owned by users.

Attributes:

* plant_id
* user_id
* plant_name
* scientific_name
* image_url
* created_at

---

### Plant Care

Stores care instructions for each plant.

Attributes:

* plant_id
* watering_frequency
* light_requirement
* fertilizer_schedule
* care_instructions

---

### Tasks

Stores plant care reminders.

Attributes:

* task_id
* plant_id
* task_type
* due_date
* completion_status

---

### Chat Messages

Stores chatbot conversation history.

Attributes:

* message_id
* user_id
* plant_id
* role
* message
* timestamp

---

# 8. API Design Overview

The system exposes backend functionality through **Edge Functions APIs**.

### Plant Identification API

```
POST /identify-plant
```

Input:

* image_url

Output:

* plant_name
* scientific_name
* care instructions

---

### Care Generation API

```
POST /generate-care
```

Input:

* plant_species

Output:

* watering schedule
* light requirements
* fertilizer guidance

---

### Botanist Chat API

```
POST /botanist-chat
```

Input:

* user_question
* plant_context

Output:

* AI response

---

# 9. Security Design

### Authentication

Supabase authentication manages:

* user sign-up
* login
* session tokens

### Authorization

Row-level security ensures:

* users can only access their plants
* users cannot access other users’ data

### Secure AI Access

Claude API calls are handled through backend services to prevent exposing API keys.

---

# 10. Scalability Considerations

The architecture supports scalability through:

* serverless backend
* managed database
* cloud image storage
* stateless API services

Future scalability improvements may include:

* caching plant care information
* background AI processing
* push notifications
* distributed AI inference

---

# 11. Monitoring and Logging

Monitoring tools include:

* Supabase logs
* Edge function monitoring
* API request logging
* AI usage tracking

Key metrics monitored:

* plant scans per user
* chatbot queries
* reminder completion rate
* average plant library size

---

# 12. Deployment Architecture

### Mobile App

* Built with Expo
* Distributed through app stores

### Backend

* Hosted on Supabase

### AI Integration

* Anthropic API hosted externally

---

# 13. Future Enhancements

Potential improvements include:

* plant disease image detection
* plant growth tracking
* push notifications
* social plant sharing
* AI-generated plant care plans
* community plant database

---

# 14. Conclusion

The Plant Identification & Care App architecture uses a **mobile-first serverless design**, combining:

* React Native mobile application
* Supabase backend infrastructure
* AI capabilities from Anthropic Claude

This architecture enables rapid development, scalable infrastructure, and intelligent plant care guidance while maintaining simplicity and maintainability.

---
