# 4 In A Row — Real-Time Multiplayer Game

A robust, full-stack, real-time implementation of the classic "Connect Four" game. This project demonstrates high-concurrency communication using WebSockets, persistent data storage with MySQL, and decoupled event-driven architecture using Kafka.

##  Key Features

###  Real-Time Matchmaking
- **Queue System**: Players enter a username and are placed in a waiting lobby.
- **Bot Fallback**: If no human opponent is found within **10 seconds**, a competitive AI Bot is automatically spawned to ensure a seamless user experience.

###  Strategic Competitive Bot
- **Win Detection**: The bot actively scans for an immediate winning move.
- **Blocking Logic**: If the opponent is one move away from victory, the bot identifies and blocks the specific column.
- **Positional Play**: In neutral states, the bot prioritizes the center columns to maximize its mathematical chances of connecting four.

###  Real-Time Gameplay & Resilience
- **WebSockets**: Utilizes `Socket.io` for bi-directional, low-latency communication.
- **30s Reconnection**: Implements a grace period. If a player disconnects or refreshes, they can rejoin their active session within 30 seconds using their username.
- **Forfeit Logic**: If a player fails to reconnect within the window, the opponent is automatically declared the winner.

###  Leaderboard & Analytics
- **Persistent Storage**: Game wins are recorded in a MySQL database.
- **Live Leaderboard**: The frontend fetches and displays the Top 10 players globally.
- **Kafka Integration**: Gameplay events (moves, wins, starts) are emitted to a Kafka broker for decoupled, non-blocking analytics processing.

---

##  Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Axios, Socket.io-client |
| **Backend** | Node.js (ESM), Express.js, Socket.io |
| **Database** | MySQL (Persistence), In-memory Maps (Game State) |
| **Messaging** | Kafka (Analytics Pipeline) |
| **Styling** | Custom CSS3 (Responsive Design, Flexbox, Shadows) |

---
##  Setup & Installation

### 1. Database Configuration
Open your MySQL Terminal or Workbench and run the following script:

```sql
CREATE DATABASE IF NOT EXISTS four_in_a_row;
USE four_in_a_row;

CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    wins INT DEFAULT 0
);

```
---
### 2. Environment Variables
Create a file named `.env` inside the `backend` folder and populate it with your local configuration:

```plaintext
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=four_in_a_row
PORT=3001
KAFKA_BROKER=localhost:9092
```
---
### 3. Run the Backend
Open your terminal, navigate to the `backend` directory, and run the following commands to install the dependencies and start the server:

```bash
npm install
npm start
```
---
### 4. Run the Frontend
Open a new terminal window, navigate to the frontend directory, and run these commands to start the React development server:

```bash
npm install
npm run dev
```
---
### 5. Run Analytics
To process the gameplay events, ensure you have a Kafka broker running at localhost:9092. Then, in the backend directory, run:

```bash
node analyticsService.js
```
---


