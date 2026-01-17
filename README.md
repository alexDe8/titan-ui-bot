# 🤖 Titan UI Bot — Automated Swap Farming (Brave + Phantom)

Automated UI bot for Titan Exchange on Solana using Playwright and Brave Browser with Phantom Wallet.

This bot:
- Opens Brave with Phantom extension loaded
- Connects to Titan Exchange
- Clicks Max → Swap
- Waits for Phantom confirmation
- Automatically confirms transactions
- Randomizes delay between swaps
- Handles page restore and recovery logic

⚠️ This is UI automation. Use at your own risk.

---

## 🚀 Features

- ✅ Brave browser automation
- ✅ Phantom extension support
- ✅ Auto Max + Swap
- ✅ Auto Phantom confirmation
- ✅ Random delay between swaps
- ✅ Recovery if page reloads or crashes
- ✅ Startup normalization if wallet state is inconsistent
- ✅ Works with restored browser sessions

---

## 📦 Requirements

- Node.js >= 18
- Brave Browser
- Phantom Wallet (installed locally)
- macOS or Windows

---

## 🖥 macOS Installation

### 1️⃣ Install dependencies

Install Node.js:
https://nodejs.org

Install Brave:
https://brave.com

Verify installation:
node -v
npm -v


⸻

2️⃣ Clone repository

git clone https://github.com/alexDe8/titan-ui-bot.git
cd titan-ui-bot
npm install


⸻

3️⃣ Install Phantom Extension Locally

Playwright cannot load extensions directly from the Chrome Web Store.

Steps:
	1.	Install Phantom normally in Brave.
	2.	Open:

brave://extensions


	3.	Enable Developer Mode
	4.	Click Pack extension or manually extract Phantom extension files.
	5.	Copy the extracted folder into:

~/Downloads/phantom

Make sure this folder contains:

manifest.json


⸻

4️⃣ Run the bot

node test.js

Brave will open automatically.

First time:
	•	Unlock Phantom manually when prompted.
	•	The bot will auto-confirm transactions afterward.

⸻

🪟 Windows Setup (Experimental)

⚠️ Windows support is experimental.
Tested mainly on macOS. Some paths may require adjustments.

⸻

1️⃣ Install Node.js

Download and install Node.js (LTS):

https://nodejs.org

Verify:

node -v
npm -v


⸻

2️⃣ Install Brave Browser

Download and install Brave:

https://brave.com

⸻

3️⃣ Clone repository

Open Command Prompt or PowerShell:

git clone https://github.com/alexDe8/titan-ui-bot.git
cd titan-ui-bot
npm install


⸻

4️⃣ Install Phantom Extension Locally

Steps:
	1.	Install Phantom normally in Brave.
	2.	Open:

brave://extensions


	3.	Enable Developer Mode
	4.	Click Pack extension or manually extract Phantom extension files.
	5.	Copy the extracted folder into:

C:\Users\<YOUR_USERNAME>\Downloads\phantom

Verify the folder contains:

manifest.json


⸻

5️⃣ Configure Brave executable path

Edit test.js and locate:

const braveExecutablePath =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

Replace with:

const braveExecutablePath =
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

Adjust path if needed.

⸻

6️⃣ Run the bot

node test.js

Unlock Phantom manually the first time.

⸻

⚠️ Windows Notes
	•	You may need to run terminal as Administrator.
	•	Antivirus software may block browser automation.
	•	UI automation may be slower than macOS.
	•	If Phantom popup is not detected, retry.

⸻

⚙️ Configuration

You can modify inside test.js:

Random delay:

const delay = 5000 + Math.floor(Math.random() * 15000);

Change values as needed.

⸻

⚠️ Security Notice
	•	Never share your wallet seed phrase.
	•	Always verify Phantom popups before confirming.
	•	This script controls your browser — use only on trusted machines.
	•	Small amounts recommended for testing.

⸻

🧪 Disclaimer

No financial responsibility is assumed.
Use at your own risk.

⸻

🤝 Contributions

Pull requests and improvements are welcome.

⸻

⭐ Support

If this project helps you, consider giving it a star ⭐
