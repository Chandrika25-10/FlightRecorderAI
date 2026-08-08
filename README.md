# ✈️ FlightRecorder AI

**FlightRecorder AI** is an AI-agent observability, monitoring, and incident investigation platform designed to make autonomous AI-agent activities more transparent, traceable, and accountable.

The application records AI-agent sessions and actions, maintains structured execution logs, verifies the integrity of those logs using cryptographic hash chains, detects and investigates incidents, performs root-cause analysis, and provides human-in-the-loop confirmation for potentially high-risk actions.

---

## 🌐 Project Links

### GitHub Repository

https://github.com/Chandrika25-10/FlightRecorderAI

### Google AI Studio

https://ai.studio/apps/620ebdfd-d514-4b97-9975-f84c9a8e3d6d

### Live Application

https://flightrecorder-ai.ai.studio/

---

# 📌 Project Overview

As AI agents become capable of performing increasingly complex tasks autonomously, it becomes important to maintain a reliable record of their actions.

An AI agent may perform several actions using different tools before completing a task. If an unexpected or harmful action occurs, it can be difficult to determine:

* What exactly happened?
* Which action caused the problem?
* Why did the agent perform that action?
* Were the recorded logs modified?
* Should a human approve a high-risk action?

**FlightRecorder AI** addresses these challenges by acting as a digital "flight recorder" for AI agents.

Similar to how a flight recorder preserves information about an aircraft's operation, FlightRecorder AI records and analyzes the sequence of actions performed by an AI agent.

The platform combines **AI-agent simulation, activity logging, cryptographic integrity verification, incident detection, root-cause analysis, analytics, and human oversight** into a single application.

---

# 🎯 Project Objectives

The primary objectives of FlightRecorder AI are:

1. Record AI-agent activities in a structured and traceable format.
2. Maintain a reliable history of agent sessions and actions.
3. Detect and investigate abnormal or high-risk activities.
4. Identify the probable root cause of an incident.
5. Verify whether recorded logs have been tampered with.
6. Provide human approval for potentially sensitive actions.
7. Present agent activity through dashboards and analytics.
8. Generate detailed incident reports for investigation and documentation.

---

# ✨ Key Features

## 1. 🔐 User Authentication

The application provides user authentication functionality.

Users can:

* Register an account
* Log in
* Log out
* Access the application's protected functionality

Authentication allows the system to associate activities and sessions with users.

---

## 2. 🤖 AI-Agent Simulation

FlightRecorder AI includes an AI-agent simulation feature that allows users to provide a task or prompt.

The system simulates an agent performing a sequence of actions to complete the task.

For example:

```text
User Task:
Book the cheapest hotel in Hyderabad under ₹3,000 per night.
```

The simulated agent may perform multiple steps such as:

```text
1. Understand the user request
2. Search for available hotels
3. Compare prices
4. Select an option
5. Perform a potentially high-risk action
```

Each step can be recorded for later analysis.

---

## 3. 📝 AI-Agent Activity Logging

Every agent session can contain multiple execution steps.

The system records information such as:

* Session ID
* Step number
* Action performed
* Tool used
* Input
* Output
* AI response
* Timestamp
* Risk information

This creates a detailed execution history that can be reviewed during an investigation.

---

## 4. 🔗 Cryptographic Hash-Chain Verification

One of the important features of FlightRecorder AI is its **hash-chain based log integrity mechanism**.

Each log entry is connected to the previous entry using cryptographic hashing.

Conceptually:

```text
Log 1
  ↓
Hash 1
  ↓
Log 2 + Hash 1
  ↓
Hash 2
  ↓
Log 3 + Hash 2
  ↓
Hash 3
```

If an earlier log entry is modified, the corresponding hash relationship changes.

The system can therefore verify whether the recorded execution history remains consistent.

### Tamper Detection

The application also supports a tamper-testing workflow.

A log can be intentionally modified for testing purposes, after which the verification mechanism can be used to identify the integrity problem.

This demonstrates how hash-chain verification can be applied to AI-agent audit logs.

---

# 5. 🚨 Incident Detection

FlightRecorder AI identifies problematic or suspicious agent activities and associates them with incidents.

An incident can contain information such as:

* Incident ID
* Session ID
* Severity
* Reason
* Root-cause information
* Confidence score
* Recommendation
* Status
* Timestamp

This allows users to move from simply viewing logs to actively investigating incidents.

---

# 6. 🧠 Root-Cause Analysis

After an incident is identified, the system can analyze the associated agent execution history to determine the likely cause.

The analysis can identify:

* Suspected root-cause step
* Supporting evidence
* Confidence level
* Recommended action

This helps answer:

> **Why did the incident happen?**

Rather than simply showing the final failure, the system attempts to identify the step in the agent's execution that contributed to the incident.

---

# 7. ⚠️ High-Risk Action Detection

Some agent actions may require additional scrutiny because they could have significant consequences.

FlightRecorder AI can identify actions marked as high-risk and use this information to initiate a human-confirmation workflow.

This introduces an additional safety layer between autonomous agent execution and sensitive actions.

---

# 8. 👤 Human-in-the-Loop Confirmation

FlightRecorder AI supports human oversight for high-risk actions.

When an agent reaches an action requiring confirmation, the system can create a confirmation request.

The user can then:

* Review the action
* Approve the action
* Reject the action

The workflow can be represented as:

```text
AI Agent
   │
   ▼
High-Risk Action
   │
   ▼
Human Confirmation
   │
   ├───────────────┐
   ▼               ▼
 APPROVE          REJECT
   │               │
   ▼               ▼
Continue        Stop/Reject
```

This demonstrates the concept of **human-in-the-loop AI**, where autonomous systems remain subject to human supervision.

---

# 9. 📊 Dashboard

The FlightRecorder AI dashboard provides an overview of the system.

It can display information such as:

* Total sessions
* Incident statistics
* Recent activity
* Incident trends
* Pending confirmations
* Open incidents

The dashboard provides a centralized view of the AI-agent environment.

---

# 10. 📈 Analytics

The analytics section presents information about agent activity and incidents in a visual format.

It can be used to understand:

* Incident frequency
* Activity trends
* Session information
* Incident distribution
* Overall system activity

Charts and graphical components make the information easier to interpret.

---

# 11. 📄 Incident Reports

FlightRecorder AI provides incident-report functionality for documenting investigations.

A report can contain:

* Incident details
* Session information
* Root-cause information
* Evidence
* Log information
* Integrity verification results
* Report generation details

These reports can be useful for auditing, debugging, documentation, and academic demonstrations.

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │ TypeScript + Vite   │
                    └──────────┬──────────┘
                               │
                         API Requests
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │      Node.js        │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
       ┌────────────┐   ┌─────────────┐   ┌──────────────┐
       │  MongoDB   │   │ Hash Chain  │   │ Gemini API   │
       │  Database  │   │ Verification│   │ AI Services  │
       └────────────┘   └─────────────┘   └──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Incident Analysis   │
                    │ & Human Oversight    │
                    └─────────────────────┘
```

---

# 🔄 Application Workflow

The overall workflow of the application is:

```text
1. User Authentication
          ↓
2. Start AI-Agent Simulation
          ↓
3. Provide Agent Task / Prompt
          ↓
4. Generate Agent Execution Steps
          ↓
5. Record Agent Activities
          ↓
6. Create Hash Chain for Logs
          ↓
7. Detect Potential Incident
          ↓
8. Perform Root-Cause Analysis
          ↓
9. Detect High-Risk Actions
          ↓
10. Request Human Confirmation
          ↓
11. Approve / Reject Action
          ↓
12. Investigate / Resolve Incident
          ↓
13. View Analytics
          ↓
14. Generate Incident Report
```

---

# 🛠️ Technology Stack

| Technology            | Purpose                             |
| --------------------- | ----------------------------------- |
| **React**             | Frontend user interface             |
| **TypeScript**        | Type-safe development               |
| **Vite**              | Frontend development and build tool |
| **Node.js**           | Backend runtime                     |
| **Express.js**        | REST API and backend server         |
| **MongoDB**           | Database and persistent storage     |
| **Google Gemini API** | AI functionality                    |
| **Tailwind CSS**      | Styling and responsive UI           |
| **Recharts**          | Analytics and data visualization    |
| **Lucide React**      | User-interface icons                |
| **Motion**            | Interface animations                |
| **jsPDF**             | Report/PDF generation               |

---

# 📂 Project Structure

```text
FlightRecorderAI/
│
├── src/
│   ├── components/
│   │   └── React UI components
│   │
│   ├── server/
│   │   ├── agentSimulator.ts
│   │   ├── db.ts
│   │   ├── hashchain.ts
│   │   └── rootcause.ts
│   │
│   ├── types/
│   │   └── TypeScript type definitions
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── server.ts
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── metadata.json
├── .gitignore
└── README.md
```

---

# ⚙️ Prerequisites

Before running the application locally, make sure the following are installed:

* **Node.js**
* **npm**
* **MongoDB**
* **Google Gemini API key**

---

# 🚀 Installation and Setup

Follow these steps in order.

## Step 1: Clone the Repository

```bash
git clone https://github.com/Chandrika25-10/FlightRecorderAI.git
```

Then navigate into the project directory:

```bash
cd FlightRecorderAI
```

---

## Step 2: Install Dependencies

Run:

```bash
npm install
```

This installs all dependencies required by the project.

---

## Step 3: Configure the Gemini API Key

Create a file named:

```text
.env.local
```

in the root directory.

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace `your_gemini_api_key` with your actual Google Gemini API key.

### ⚠️ Important

**Never upload your API key to GitHub.**

Make sure `.env.local` is included in `.gitignore`.

---

## Step 4: Start the Application

Run:

```bash
npm run dev
```

The development server will start and the terminal will display the local application address.

The application can normally be accessed at:

```text
http://localhost:3000
```

---

# 🔄 Script Execution Order

Individual source files **do not need to be executed manually**.

The application is started through the npm command:

```bash
npm run dev
```

The general execution flow is:

```text
npm run dev
     ↓
Vite + Express Server
     ↓
server.ts
     ↓
React Application
     ↓
src/main.tsx
     ↓
src/App.tsx
     ↓
React Components
     ↓
Backend APIs / Database / Gemini API
```

### Important Files

| File                           | Purpose                                   |
| ------------------------------ | ----------------------------------------- |
| `server.ts`                    | Starts and configures the Express backend |
| `src/main.tsx`                 | Frontend entry point                      |
| `src/App.tsx`                  | Main React application                    |
| `src/server/agentSimulator.ts` | Agent simulation functionality            |
| `src/server/db.ts`             | Database operations                       |
| `src/server/hashchain.ts`      | Hash-chain functionality                  |
| `src/server/rootcause.ts`      | Root-cause analysis                       |
| `package.json`                 | Project dependencies and npm scripts      |

---

# 🧪 Available Commands

## Development

```bash
npm run dev
```

Starts the application in development mode.

## Build

```bash
npm run build
```

Creates the production build.

## Production

```bash
npm start
```

Starts the production server after building the project.

## Preview

```bash
npm run preview
```

Previews the production frontend build.

## Lint

```bash
npm run lint
```

Checks the project for code/type-related issues.

---

# 🔐 Security Considerations

The application uses API keys and database connectivity, so sensitive configuration should be protected.

* Do not commit `.env.local`.
* Do not expose the Gemini API key publicly.
* Use secure database credentials.
* Use HTTPS for production deployment.
* Implement stronger authentication and authorization before production use.
* Restrict access to administrative and incident-management functionality.

This project is primarily intended as an **academic/educational prototype**, and additional security hardening would be required for a production environment.

---

# 🎓 Learning Outcomes

This project demonstrates practical knowledge of:

* Full-stack web development
* React and TypeScript
* Node.js and Express
* REST API development
* MongoDB integration
* Google Gemini API integration
* AI-agent simulation
* AI-agent observability
* Cryptographic hash chains
* Tamper detection
* Incident management
* Root-cause analysis
* Human-in-the-loop AI
* Data visualization
* Report generation

---

# 🔮 Future Enhancements

Possible future improvements include:

* Role-based access control
* Advanced authentication and authorization
* Real-time agent monitoring
* Live log streaming
* Advanced anomaly detection
* Multi-agent monitoring
* Automated alert notifications
* Cloud deployment
* More comprehensive automated testing
* Enhanced audit trails
* Advanced report generation
* Integration with real autonomous AI agents
* Improved security and access control

---

# 🎯 Conclusion

FlightRecorder AI demonstrates how AI-agent activity can be recorded, monitored, investigated, and verified through a unified observability platform.

By combining **structured activity logging, cryptographic integrity verification, incident investigation, root-cause analysis, analytics, and human-in-the-loop confirmation**, the project provides a practical approach toward building more transparent and accountable AI-agent systems.

---

# 👩‍💻 Author

**Chandrika**

GitHub Repository:
https://github.com/Chandrika25-10/FlightRecorderAI

---

# 📜 License

This project is developed for **educational and academic purposes**.
