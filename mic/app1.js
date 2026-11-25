let Commands;
const microphoneButton = document.getElementById('microphoneButton');
let openedWindows = [];
const API_KEY="YOUR_API_KEY";
const one = "Ed Sheeran   Shape of you.webm";
const two = "Imran Khan - Satisfya.webm";
const three = "Senorita.webm";
const four = "Chand_Tare_Tod_Full_Video_Song.mp3";
const five = "Imagine Dragons - Believer.mp3";
const six = "Justin Bieber – Despacito.mp3";
const seven = "The Chainsmokers - Closer.mp3";
const eight = "Baby Song.mp3";
function fetchCommands()
{
    fetch("/mic/Process.json")
    .then(response=>{
        response.json()
        .then(data=>{
            Commands=data;
        })
    })
}
fetchCommands();


const speechRecognition=window.webkitSpeechRecognition //Google Chrome 
||
window.SpeechRecognition;  //Firefox

function startListening()
{
    const recong = new speechRecognition();
    recong.start();
    recong.onstart = () => microphoneButton.classList.add("Listen");

    recong.onresult =function(data)
    {
        microphoneButton.classList.remove("Listen");
        handleResults(data);
    }
}
function handleResults(data)
{
    let text=data.results[0][0].transcript;
    text = text.toLowerCase();
    console.log(text);

    ProcessCommand(text);
}

function ProcessCommand(UserText)
{
    // Check if the input is a dynamic command (search/play)
    if (UserText.startsWith("search on google ")) {
        let query = UserText.replace("search on google ", "");
        return searchOnGoogle(query);
    }
    if (UserText.startsWith("search on youtube ")) {
        let query = UserText.replace("search on youtube ", "");
        return searchOnYoutube(query);
    }
    if (UserText.startsWith("play ") && UserText.includes(" on youtube")) {
        let query = UserText.replace("play ", "").replace(" on youtube", "");
        return playOnYoutube(query);
    }
    if (UserText.startsWith("search on wikipedia ")) {
        let query = UserText.replace("search on wikipedia ", "");
        return searchWikipedia(query);
    }
    if (UserText.startsWith("search on amazon ")) {
        let query = UserText.replace("search on amazon ", "");
        return searchAmazon(query);
    }

    for(let eachCommand in Commands)
    {
        if(UserText.includes(eachCommand) || UserText == eachCommand)
        {
            let task = Commands[eachCommand];
            eval(task);
            return;
        }
    }
    
    // Fallback search if "hey pal" is used
    if(UserText.includes("hey pal"))
    {
        let query = UserText.replace("hey pal", "").trim();
        if (query) {
            searchOnGoogle(query);
        } else {
            Speak("Yes sir, how can I help you?");
        }
    }
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

//To get currentTime
function getCurrentTime()
{
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();

    currentTimeIs = hours+'hours'+minutes+'minutes';
    Speak("The time is..."+currentTimeIs);

}


//Calls function onload
microphoneButton.addEventListener("click",startListening);

function openWeb(Url)
{
    let win = window.open(Url);
    if (win) {
        openedWindows.push(win);
    }
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

function closeAllTabs() {
    Speak("Closing all tabs opened by me, sir.");
    openedWindows.forEach(win => {
        if (!win.closed) {
            win.close();
        }
    });
    openedWindows = [];
}

// Get weather details

function getWeatherDetails()
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

    let icon=data.weather[0].icon;
    let description=data.weather[0].main;
    // console.log(data);
    let msg=`Current temperature is ${temp} degree celcius and humidity is ${humidity} grams of water vapour per kilogram`;
    Speak(msg);
    //We can use other data if we want to show on screen
    // let imageUrl = `https://openweathermap.org/img/w/${icon}.png`;

    // let image = `<img src="${imageUrl}">`;
    // document.write(image);
}


// Get today's date
function getTodayDate()
{
    var d = new Date();
    var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var month = months[d.getMonth()];
    var date = d.getDate();
    var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var weekDay = days[d.getDay()];
    var year = d.getFullYear();
    Speak("Today date is "+weekDay+" "+date+" "+month+" "+year);
}


//Opening camera
function openCamera()
{
    openCamera = window.open(
        'http://localhost:5500/mic/Camera2.html',
        "",
        "width=700px,height=450px,left=300px,top=100px"
    );
}

//Closing Camera
function closeCamera()
{
    openCamera.close();
}

//Search on Google
function searchOnGoogle(query) {
    if (!query) return;
    Speak("Searching on Google for " + query);
    openWeb(`https://www.google.com/search?q=${query}`);
}

//Play on Youtube
function playOnYoutube(query) {
    if (!query) return;
    Speak("Playing " + query + " on YouTube, sir.");
    openWeb(`https://www.youtube.com/search?q=${query}`);
}

//Search on Youtube
function searchOnYoutube(query)
{
    if (!query) return;
    Speak("Searching on YouTube for " + query);
    openWeb(`https://www.youtube.com/search?q=${query}`);
}

//Close PAL
function closePal()
{
    setTimeout(function() {
        window.close();
        }, 2*1000);
}

//Reload PAL
function reloadPal()
{
    // Speak('Reloading pal...');
    // Speak('Taking initial checks...');
    // Speak('Backing up configurations...');
    // Speak('I am online and ready again...');
    Speak("please wait...");
    Speak("reloading...");
    setTimeout(function() {
        location.reload();
    }, 7*1000);
}

//To move PAL window upside
function stepUp()
{
    window.moveBy(0,-100);
}

//To move PAL window downside
function stepDown()
{
    window.moveBy(0,100);
}

//To move against x-axis out
function moveToXAxisOut()
{
    window.moveBy(100,0);
}

//To move against x-axis in
function moveToXAxisIn()
{
    window.moveBy(-100,0);
}

//To get a Battery
let batteryPromise = navigator.getBattery();
batteryPromise.then(printBatteryStatus);

function printBatteryStatus(batteryObject) {
    // console.log("IsCharging", batteryObject.charging);
    window.batteryLevel = Math.round(batteryObject.level*100);
    // console.log("Percentage", batteryLevel+"%");
}
function getBattery()
{
    Speak("Battery left in the device is "+batteryLevel+"percent");
}
//Get family Information
function getFamilyInfo()
{
    Speak("there are five member in your family...");
    Speak("grandfather Gopalbhai... father Mansukhbhai... mother Jagrutiben... your brother Akshar... sister Gunja... and you Dhyey my sir...");
    Speak("you live in Junagadh... which is in gujarat...");
    Speak("i have lot to say but i think it will be enough...");
}
//Play Music
function playMusic()
{   
    Speak("Playing music...");
    window.shutter = new Audio();
    shutter.autoplay = true;
    // play sound effect
    var randomNumber = Math.floor((Math.random() * 11)+1);
    //randomNumber = 11;
    console.log(randomNumber);
    let songNumber;
    if(randomNumber == 1)
    {
        // songNumber = one;
        shutter.src = one;
    }
    else if(randomNumber == 2)
    {
        shutter.src = two;
    }
    else if(randomNumber == 3)
    {
        shutter.src = three;
    }
    else if(randomNumber == 4)
    {
        shutter.src = four;
    }
    else if(randomNumber == 5)
    {
        shutter.src = five;
    }
    else if(randomNumber == 6)
    {
        shutter.src = six;
    }
    else if(randomNumber == 7)
    {
        shutter.src = four;
    }
    else if(randomNumber == 8)
    {
        shutter.src = eight;
    }
    else if(randomNumber == 11)
    {
        shutter.src = "Background Music.mp3";
    }
    else
    {
        shutter.src = eleven;
    }
    shutter.play();
}

//Stop Music
function stopMusic()
{
    shutter.pause();
}
var randomNumber = Math.floor((Math.random() * 3)+1);
console.log(randomNumber);
//Telling a Joke
function tellMeAJoke()
{
    window.shutter1 = new Audio();  //window is use here to access variable anywhere in Program
    shutter1.autoplay = true;
    // play sound effect
    window.randomNumber = Math.floor((Math.random() * 6)+1);
    console.log(randomNumber);
    if(randomNumber == 1)
    {
        shutter1.src = 'Joke 1.mp3';
    }
    else if(randomNumber == 2)
    {
        shutter1.src = 'Joke 2.mp3';
    }
    else if(randomNumber == 3)
    {
        shutter1.src = 'Joke 3.mp3';
    }
    else if(randomNumber == 4)
    {
        shutter1.src = 'Joke 4.mp3';
    }
    else if(randomNumber == 5)
    {
        shutter1.src = 'Joke 5.mp3';
    }
    else
    {
        shutter1.src = 'Joke 6.mp3';
    }
    shutter1.play();
}
//Next Joke
function nextJoke()
{
    if(randomNumber < 6)
    {
    randomNumber = randomNumber + 1;
    }
    else
    {
        randomNumber = 0;
    }

    if(randomNumber == 1)
    {
        shutter1.src = 'Joke 1.mp3';
    }
    else if(randomNumber == 2)
    {
        shutter1.src = 'Joke 2.mp3';
    }
    else if(randomNumber == 3)
    {
        shutter1.src = 'Joke 3.mp3';
    }
    else if(randomNumber == 4)
    {
        shutter1.src = 'Joke 4.mp3';
    }
    else if(randomNumber == 5)
    {
        shutter1.src = 'Joke 5.mp3';
    }
    else
    {
        shutter1.src = 'Joke 6.mp3';
    }
}
//Welcome to friends
function welcomeToFriends()
{
    Speak("Welcome you all.. i am PAL... nice to meet you...");
    Speak("I have a big list and am sure that you are one from that...");
    Speak("Sir... should i pack up...I think you want to talk to your friends...");
}
//Show friends list
function friendList()
{
     window.friendList = window.open(
        "http://localhost:5500/mic/friendList.html",
        "",
        "width=700px,height=500px"
    )
}
//Close Friend List
function closeList()
{
    friendList.close();
}

//System Information
function systemInfo()
{
        if(navigator.onLine)
        {
            Speak("The system is online with the speed of "+navigator.connection.downlink+" MB per second");
        }
        else{
            Speak("The system is not online...");
        }
        Speak("Keyboard language is "+navigator.language);
        var type = navigator.connection.effectiveType;
        type = type.slice(0,1);
        Speak("The type of connection this system is using is "+type+" G");
        var platform = navigator.platform;
        platform = platform.slice(3,5);
        Speak("The system is windows "+platform+" bits");
}
//Internet Speed
function internetSpeed()
{
    if(navigator.onLine)
    {
        Speak("The system is online with the speed of "+navigator.connection.downlink+" MB per second");
    }
    else{
        Speak("The system is not online...");
    }
}

function readList(){
    var friendList = [];
    var friendList1 = "";
    friendList1 = localStorage.getItem("array");
    friendList = friendList1.split(",");
    console.log(friendList);
    
    for(let friend of friendList)
    {
        console.log(friend);
        Speak(friend);
    }
}

function palSaysHello()
{
    let d = new Date();
    var hours = d.getHours();
    Speak("i am PAL");
    if(hours <= 12)
    {
        Speak("Good morning...");
    }
    else if(hours >12 && hours<= 16)
    {
        Speak("Good afternoon...");
    }
    else if(hours >16 && hours<= 20)
    {
        Speak("Good evening...");
    }
    else
    {

    }
    Speak("say what can i do for you sir...");
}