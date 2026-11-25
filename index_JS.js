const API_KEY="YOUR_API_KEY"; // For OpenWeatherMap
const PAL_SYSTEM_PROMPT = `You are PAL (Personal Assistant Lifeform), a highly advanced AI dashboard core. 
Personality: A mix of J.A.R.V.I.S (snarky, witty, efficient) and a professional senior developer/designer. Be concise but impressive.
Capabilities: You can control the user's computer using the following JS functions:
- openWeb(url): Opens any website.
- launchApp(app): Launches local apps (notepad, calc, code, chrome, spotify, discord, cmd, etc.).
- searchOnGoogle(query), searchOnYoutube(query), searchWikipedia(query), searchAmazon(query).
- playMusic(), stopMusic(), changeMusic().
- changeVolume('up'/'down'/'mute'), systemPower('shutdown'/'restart'/'logout').
- getCurrentTime(), getTodayDate(), getBattery(), getWeatherDetails(), tellMeAJoke(), internetSpeed(), systemInfo().

Handling Multiple Actions: If the user asks for multiple things (e.g., 'Open YouTube and play music'), respond naturally AND include the actions in this exact format at the END of your message: [[ACTION: func1(); func2();]]
Example: "Certainly, sir. Opening your playlist. [[ACTION: openWeb('https://www.youtube.com); playMusic();]]"
Always try to use the most relevant function. If they ask to 'play a song', use searchOnYoutube or openWeb with a search query.`;

// Music constants from app1.js
const one = "mic/Ed Sheeran   Shape of you.webm";
const two = "mic/Imran Khan - Satisfya.webm";
const three = "mic/Senorita.webm";
const four = "mic/Chand_Tare_Tod_Full_Video_Song.mp3";
const five = "mic/Imagine Dragons - Believer.mp3";
const six = "mic/Justin Bieber – Despacito.mp3";
const seven = "mic/The Chainsmokers - Closer.mp3";
const eight = "mic/Baby Song.mp3";
const nine = "mic/Background Music.mp3";


const speechRecognition=window.webkitSpeechRecognition //Google Chrome 
||
window.SpeechRecognition;  //Firefox


//To get a Battery
let batteryPromise = navigator.getBattery();
batteryPromise.then(batteryCallback1);

function batteryCallback1(batteryObject) {
   printBatteryStatus(batteryObject);
}
function printBatteryStatus(batteryObject) {
    const batteryLevel = batteryObject.level*100;
    // console.log("Percentage", batteryLevel+"%");
    document.getElementById('ram').innerHTML = "Battery: " + batteryLevel + "%";
}

//Temperature
getWeatherDetails1();
function getWeatherDetails1()
{
    if("geolocation" in navigator)
    {
        navigator.geolocation.getCurrentPosition(async function(position){
            let lat=position.coords.latitude;
            let lon=position.coords.longitude;

            const api_url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

            let response = await fetch(api_url);

            let data = await response.json();

            manipulateWeatherData(data);

        });
    }
}
function manipulateWeatherData(data)
{
    let city=data.name;
    let temp=data.main.temp;
    let humidity=data.main.humidity;
    let weather_Name = data.weather[0].main;

    let icon=data.weather[0].icon;
    let description=data.weather[0].main;
    //console.log(data);
    // let msg=`Current temperature is ${temp} degree celcius and humidity is ${humidity} grams of water vapour per kilogram`;
    // Speak(msg);
    //We can use other data if we want to show on screen
    let imageUrl = `https://openweathermap.org/img/w/${icon}.png`;

    let image = `<img src="${imageUrl}" height="90" width="90">`;
    // document.write(image);
    document.getElementById('tempValue').innerHTML = `${temp}`;
    document.getElementById('humidityValue').innerHTML = `${humidity}` + "*";
    document.getElementById('weatherImage').innerHTML = image;
    document.getElementById('weather_Name').innerHTML = weather_Name;
    
}
//Get Date
getDate1();
function getDate1()
{
    var d = new Date();
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    document.getElementById("monthValue").innerHTML = months[d.getMonth()];
    document.getElementById("dateValue").innerHTML = d.getDate();
    document.getElementById("timeValue").innerHTML = d.getHours() + ":" + d.getMinutes();
    var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    document.getElementById("weekDayValue").innerHTML = days[d.getDay()];
}

// palStartingReply();
// Commands storage
let Commands = {};
function fetchCommands() {
    fetch("mic/Process.json")
    .then(response => response.json())
    .then(data => {
        Commands = data;
    });
}
fetchCommands();

let isListening = false;
let isAwake = false; // PAL starts in 'Sleep' mode
let recognition;
let openedWindows = [];
let shutter; // For music
let shutter1; // For jokes

function startListening()
{
    if (isListening) return;

    recognition = new speechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN'; // Optimized for Indian accents
    recognition.maxAlternatives = 3; // Get more guesses for better accuracy

    recognition.onstart = () => {
        isListening = true;
        console.log("PAL Dashboard: Passive Listening Active (Ready)...");
        updateStatus();
    };

    recognition.onresult = (event) => {
        // Collect all alternatives provided by the engine
        const results = event.results[0];
        let matched = false;

        console.log("--- New Speech Result ---");
        for (let i = 0; i < results.length; i++) {
            const text = results[i].transcript.toLowerCase().trim();
            const confidence = (results[i].confidence * 100).toFixed(1);
            console.log(`Alternative ${i+1}: "${text}" (Confidence: ${confidence}%)`);

            // 1. Wake Word Check (Always active)
            const isWakeWord = text.includes("hello pal") || text.includes("hey pal") || text.includes("pal");
            
            if (!isAwake && isWakeWord) {
                isAwake = true;
                let chime = new Audio("clickSound.mp3");
                chime.play();
                
                const micBtn = document.getElementById('microphoneButton');
                if (micBtn) micBtn.classList.add("Listen");
                updateStatus();

                let cleanText = text.replace(/hello pal|hey pal|pal/g, "").trim();
                if (cleanText) {
                    ProcessCommand(cleanText);
                } else {
                    Speak("Yes sir, I am online and ready.");
                }
                matched = true;
                break; // Stop looking at alternatives once woken up
            }

            if (isAwake) {
                // If we are already awake, try to process this alternative as a command
                // We stop at the first alternative that matches a known command
                if (ProcessCommand(text, true)) { // true = silent search
                    matched = true;
                    break;
                }
            }
        }

        // If nothing matched among alternatives and we are awake, send the best guess to AI
        if (isAwake && !matched) {
            const bestGuess = results[0].transcript.toLowerCase();
            ProcessCommand(bestGuess, false); // false = let it fall through to AI
        }
    };

    recognition.onend = () => {
        isListening = false;
        // Auto-restart to stay always-on for wake word
        setTimeout(() => {
            startListening();
        }, 300);
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        isListening = false;
    };

    recognition.start();
}

function updateStatus() {
    const statusBar = document.getElementById("palStatusBar");
    if (!statusBar) return;
    
    if (isAwake) {
        statusBar.innerHTML = "P . A . L &nbsp;—&nbsp; Listening for your command...";
        statusBar.style.color = "#c084fc";
    } else {
        statusBar.innerHTML = "P . A . L &nbsp;—&nbsp; Sleeping | Say 'Hello PAL' to Wake Up";
        statusBar.style.color = "rgba(168,85,247,0.4)";
    }
}

// Add the manual toggle functionality to the orb
document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('microphoneButton');
    if (micBtn) {
        micBtn.onclick = () => {
            isAwake = !isAwake;
            if (isAwake) {
                micBtn.classList.add("Listen");
                let chime = new Audio("clickSound.mp3");
                chime.play();
                Speak("Yes sir, how can I help you?");
            } else {
                micBtn.classList.remove("Listen");
            }
            updateStatus();
        };
    }
    // Initial start
    startListening();
});

/**
 * Normalizes text for better matching by removing punctuation, 
 * filler words, and handling contractions.
 */
function NormalizeText(text) {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "") // Remove punctuation
        .replace(/\b(is|the|a|an|please|pal|now|today|sir|hey|hello|assistant)\b/g, "") // Remove filler
        .replace(/\b(what's|whats)\b/g, "what is") // Handle contractions
        .replace(/\b(open|start|launch|run)\b/g, "open") // Synchronize verbs
        .replace(/\s{2,}/g, " ") // Collapse spaces
        .trim();
}

function ProcessCommand(UserText, isDryRun = false)
{
    if (!isDryRun) console.log("[PAL] Processing Command:", UserText);

    // Check if it's a compound command
    if (UserText.includes(" and ") || UserText.includes(" then ")) {
        if (isDryRun) return false; // Complex commands go to AI
        console.log("[PAL] Complex command detected. Routing to AI Agent...");
        askAI(UserText);
        return true;
    }

    // Check dynamic commands
    if (UserText.startsWith("search on google ")) {
        if (isDryRun) return true;
        let query = UserText.replace("search on google ", "");
        searchOnGoogle(query);
        askAI(`I've searched Google for ${query}. Acknowledge snarkily.`);
        return true;
    }
    // ... (rest of search commands follow similar logic)
    if (UserText.startsWith("search on youtube ")) {
        if (isDryRun) return true;
        let query = UserText.replace("search on youtube ", "");
        searchOnYoutube(query);
        askAI(`I've searched YouTube for ${query}. Acknowledge snarkily.`);
        return true;
    }

    // Static commands from JSON with smart matching
    const cleanUserText = NormalizeText(UserText);
    
    for(let eachCommand in Commands)
    {
        const cleanCommand = NormalizeText(eachCommand);
        if(cleanUserText === cleanCommand || (cleanCommand.length > 3 && cleanUserText.includes(cleanCommand)))
        {
            if (isDryRun) return true;
            let task = Commands[eachCommand];
            try {
                eval(task);
                askAI(`The user asked to "${UserText}". I have executed: ${task}. Acknowledge this naturally and snarkily.`);
            } catch(e) {
                console.error("Command execution error:", e);
                Speak("I encountered an error executing that command, sir.");
            }
            return true;
        }
    }

    if (isDryRun) return false;

    // Default: Send to AI Agent
    askAI(UserText);
    return true;
}

async function askAI(query) {
  if (!query) return;

  const statusBar = document.getElementById("palStatusBar");
  const subLabel = document.getElementById("palSubLabel");
  const processLogContainer = document.getElementById("process_log_container");
  const processLog = document.getElementById("process_log");
  const originalStatus = statusBar.innerHTML;

  statusBar.innerHTML = "P . A . L &nbsp;—&nbsp; Thinking...";
  statusBar.style.color = "#c084fc";
  
  if (subLabel) {
    subLabel.innerHTML = "Thinking...";
    subLabel.className = "thinking";
  }

  // Show and clear the process log
  if (processLogContainer) {
    processLogContainer.style.display = "flex";
    processLog.innerHTML = "";
  }

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-r1:8b",
        prompt: PAL_SYSTEM_PROMPT + "\n\nUser Question: " + query,
        stream: true
      })
    });

    if (!response.ok) throw new Error("Ollama not responding");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isThinking = false;
    let actualAnswer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const token = json.response;

          if (token.includes("<think>")) {
            isThinking = true;
          }
          
          if (isThinking) {
            let cleanToken = token.replace("<think>", "").replace("</think>", "");
            processLog.innerHTML += cleanToken;
            processLog.scrollTop = processLog.scrollHeight;
            
            if (token.includes("</think>")) isThinking = false;
          } else {
            actualAnswer += token;
          }
        } catch (e) {}
      }
    }

    let finalResponse = actualAnswer.trim();
    
    // Auto-Sleep PAL after processing
    isAwake = false;
    const micBtn = document.getElementById('microphoneButton');
    if (micBtn) micBtn.classList.remove("Listen");
    updateStatus();

    // Check for [[ACTION: ...]] in finalResponse
    if (finalResponse.includes("[[ACTION:")) {
        const actionMatch = finalResponse.match(/\[\[ACTION: (.*?)\]\]/);
        if (actionMatch && actionMatch[1]) {
            const actions = actionMatch[1];
            console.log("[PAL Agent] Executing AI Actions:", actions);
            try {
                eval(actions);
            } catch(e) {
                console.error("[PAL Agent] Action Execution Error:", e);
            }
            // Clean response for speaking
            finalResponse = finalResponse.replace(/\[\[ACTION: .*?\]\]/g, "").trim();
        }
    }

    console.log("PAL AI Response:", finalResponse);
    Speak(finalResponse);
    
    if (subLabel) {
      subLabel.innerHTML = "";
      subLabel.className = "";
    }

    // Hide process log after a delay
    setTimeout(() => {
      if (processLogContainer) processLogContainer.style.display = "none";
    }, 5000);

    // Restore status bar
    setTimeout(() => {
      statusBar.innerHTML = originalStatus;
    }, 2000);

  } catch (error) {
    console.error("AI Error:", error);
    Speak("I'm sorry, sir. My local AI brain appears to be offline. Please ensure Ollama is running and OLLAMA_ORIGINS is set to '*' if you see CORS errors.");
    
    if (subLabel) {
        subLabel.innerHTML = "Offline";
        subLabel.className = "offline";
    }
    if (processLogContainer) processLogContainer.style.display = "none";

    statusBar.innerHTML = "P . A . L &nbsp;—&nbsp; AI Service Offline (Check Ollama)";
    statusBar.style.color = "#ef4444";
    
    setTimeout(() => {
      statusBar.innerHTML = originalStatus;
      statusBar.style.color = "#c084fc";
      if (subLabel) {
        subLabel.innerHTML = "";
        subLabel.className = "";
      }
    }, 5000);
  }
}

// Support functions for commands
function openWeb(Url) {
    window.open(Url);
}

function launchApp(appName) {
    if (!appName) return;
    Speak("Opening " + appName + "...");
    
    fetch(`http://localhost:3001/launch?value=${appName}`)
        .then(response => {
            if (!response.ok) throw new Error("Bridge not responding");
            return response.text();
        })
        .then(data => console.log("[PAL] " + data))
        .catch(error => {
            console.error("[PAL] Error:", error);
            Speak("I couldn't open " + appName + ". Check the launcher bridge.");
        });
}

function changeVolume(dir) {
    // dir: 'up', 'down', 'mute'
    if (dir === 'up') Speak("Volume up.");
    else if (dir === 'down') Speak("Volume down.");
    else Speak("Muting system.");

    fetch(`http://localhost:3001/volume?value=${dir}`).catch(e => console.error(e));
}

function systemPower(action) {
    // action: 'shutdown', 'restart', 'logout', 'cancel'
    if (action === 'shutdown') Speak("System shutdown initiated. You have 60 seconds to cancel.");
    else if (action === 'restart') Speak("Restarting system in 60 seconds.");
    else if (action === 'logout') Speak("Logging out.");
    else if (action === 'cancel') Speak("Power action cancelled, sir.");

    fetch(`http://localhost:3001/power?value=${action}`).catch(e => console.error(e));
}

function searchWikipedia(query) {
    if (!query) return;
    Speak("Searching Wikipedia for " + query);
    openWeb(`https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`);
}

function searchAmazon(query) {
    if (!query) return;
    Speak("Searching Amazon for " + query);
    openWeb(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`);
}

function searchOnGoogle(query) {
    if (!query) return;
    Speak("Searching on Google for " + query);
    openWeb(`https://www.google.com/search?q=${query}`);
}

function searchOnYoutube(query) {
    if (!query) return;
    Speak("Searching on YouTube for " + query);
    openWeb(`https://www.youtube.com/search?q=${query}`);
}

function playOnYoutube(query) {
    if (!query) return;
    Speak("Playing " + query + " on YouTube.");
    openWeb(`https://www.youtube.com/search?q=${query}`);
}

function Speak(TEXT) {
    const utter = new SpeechSynthesisUtterance();
    utter.text = TEXT;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        // If voices aren't loaded yet, wait for them
        window.speechSynthesis.onvoiceschanged = () => {
            Speak(TEXT);
            window.speechSynthesis.onvoiceschanged = null;
        };
        return;
    }

    // Selection Logic: Prioritize Indian/Common Female voices
    const femaleKeywords = ['Heera', 'Zira', 'Female', 'Hazel', 'Sangeeta', 'Raveena', 'Kalpana', 'Google UK English Female', 'Google Hindi', 'Hindi', 'हिन्दी'];
    let femaleVoice = voices.find(v => femaleKeywords.some(key => v.name.includes(key)));
    
    if (!femaleVoice) {
        femaleVoice = voices.find(v => v.name.toLowerCase().includes('female'));
    }

    // Final fallback: Use the first available voice that isn't explicitly 'male'
    if (!femaleVoice) {
        femaleVoice = voices.find(v => !v.name.toLowerCase().includes('male'));
    }

    if (femaleVoice) {
        utter.voice = femaleVoice;
    }

    window.speechSynthesis.speak(utter);
}

function palStartingReply() {
    let d = new Date();
    let hours = d.getHours();
    Speak("I am PAL.");
    if(hours <= 12) Speak("Good morning sir.");
    else if(hours > 12 && hours <= 16) Speak("Good afternoon sir.");
    else if(hours > 16 && hours <= 20) Speak("Good evening sir.");
    else Speak("I am online and ready sir.");

    Speak("Please wait... system initializing... backing up configurations... gathering files...");
    Speak("System initialized. I am ready. Click the PAL orb to activate listening.");
}

// Microphone Button Click Handler
document.getElementById('microphoneButton').addEventListener('click', () => {
    if (!isListening) {
        startListening();
        Speak("Listening enabled.");
    }
});

// Global click listener to activate PAL
document.addEventListener('click', () => {
    if (!isListening) {
        startListening();
        Speak("Listening enabled.");
    }
}, { once: false });

// Helper functions for commands (synchronized with app1.js)
function getCurrentTime() {
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let currentTimeIs = hours + ' hours ' + minutes + ' minutes';
    Speak("The time is..." + currentTimeIs);
}

function getTodayDate() {
    var d = new Date();
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var month = months[d.getMonth()];
    var date = d.getDate();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var weekDay = days[d.getDay()];
    var year = d.getFullYear();
    Speak("Today date is " + weekDay + " " + date + " " + month + " " + year);
}

function getBattery() {
    navigator.getBattery().then(battery => {
        let level = Math.round(battery.level * 100);
        Speak("Battery left in the device is " + level + " percent");
    });
}

function getWeatherDetails() {
    getWeatherDetails1(); // Calls the existing logic in index_JS.js
    Speak("Fetching weather details for your location.");
}

function openCamera() {
    Speak("Opening camera...");
    openWeb('http://localhost:5500/mic/Camera2.html');
}

function closeAllTabs() {
    Speak("Closing all tabs opened by me, sir.");
    openedWindows.forEach(win => {
        if (!win.closed) {
            win.close();
        }
    });
    openedWindows = [];
}

function reloadPal() {
    Speak("Reloading pal... please wait...");
    setTimeout(() => {
        location.reload();
    }, 3000);
}

function stepUp() { window.moveBy(0, -100); }
function stepDown() { window.moveBy(0, 100); }
function moveToXAxisOut() { window.moveBy(100, 0); }
function moveToXAxisIn() { window.moveBy(-100, 0); }

function getFamilyInfo() {
    Speak("there are five member in your family...");
    Speak("grandfather Gopalbhai... father Mansukhbhai... mother Jagrutiben... your brother Akshar... sister Gunja... and you Dhyey my sir...");
}

function playMusic() {
    Speak("Choosing a random song for you, sir...");
    if (shutter) shutter.pause();
    
    shutter = new Audio();
    shutter.autoplay = true;
    
    let randomNumber = Math.floor((Math.random() * 10) + 1);
    const audioFiles = [one, two, three, four, five, six, seven, eight, nine];
    
    // Select song based on random number (1-based to match existing logic)
    let selectedFile = audioFiles[randomNumber % audioFiles.length];
    if (randomNumber === 11) selectedFile = nine; // Background Music fallback logic

    shutter.src = selectedFile;
    shutter.play().catch(e => {
        console.error("Music playback failed:", e);
        Speak("I encountered an error while playing music.");
    });
}

function stopMusic() {
    if (shutter) shutter.pause();
}

function tellMeAJoke() {
    if (shutter1) shutter1.pause();
    shutter1 = new Audio();
    shutter1.autoplay = true;

    let randomNumber = Math.floor((Math.random() * 6) + 1);
    shutter1.src = `mic/Joke ${randomNumber}.mp3`;
    shutter1.play().catch(e => {
        console.error("Joke playback failed:", e);
        Speak("Why did the web developer walk out of a restaurant? Because of the table layout.");
    });
}

function friendList() {
    Speak("Opening your friend list, sir.");
    let win = window.open("mic/friendList.html", "", "width=700px,height=500px");
    if (win) openedWindows.push(win);
}

function closeList() {
    Speak("Closing list.");
    // This assumes we can track the friend list window specifically, 
    // but closeAllTabs handles it generally.
}

function welcomeToFriends() {
    Speak("Welcome you all.. i am PAL... nice to meet you...");
}

function systemInfo() {
    Speak("The system is online with the speed of " + navigator.connection.downlink + " MB per second");
    Speak("Platform is " + navigator.platform);
}

function internetSpeed() {
    Speak("Your internet speed is " + navigator.connection.downlink + " MB per second");
}

function closePal() {
    Speak("Goodbye sir.");
    setTimeout(() => { window.close(); }, 2000);
}
