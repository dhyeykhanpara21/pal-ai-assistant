const http = require('http');
const { exec } = require('child_process');
const url = require('url');

/**
 * PAL App Launcher & System Bridge
 * This server allows PAL to bypass browser security and perform:
 * 1. Launch local applications.
 * 2. Control system volume.
 * 3. Perform power operations (Shutdown, Restart).
 */

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const action = parsedUrl.query.action; // More generic name
    const value = parsedUrl.query.value;

    if (path === '/launch' && value) {
        console.log(`[PAL Bridge] Launching: ${value}`);
        exec(`start ${value}`, (error) => {
            if (error) {
                res.writeHead(500); res.end(`Error: ${error.message}`);
                return;
            }
            res.writeHead(200); res.end(`Launched ${value}`);
        });
    } 
    else if (path === '/volume' && value) {
        console.log(`[PAL Bridge] Volume Control: ${value}`);
        let psCommand = '';
        if (value === 'up') psCommand = '(new-object -com wscript.shell).SendKeys([char]175)';
        else if (value === 'down') psCommand = '(new-object -com wscript.shell).SendKeys([char]174)';
        else if (value === 'mute') psCommand = '(new-object -com wscript.shell).SendKeys([char]173)';

        if (psCommand) {
            exec(`powershell -Command "${psCommand}"`, (error) => {
                if (error) {
                    res.writeHead(500); res.end(`Error: ${error.message}`);
                    return;
                }
                res.writeHead(200); res.end(`Volume ${value} successful`);
            });
        }
    }
    else if (path === '/power' && value) {
        console.log(`[PAL Bridge] Power Action: ${value}`);
        let command = '';
        if (value === 'shutdown') command = 'shutdown /s /t 60'; // 1 min grace
        else if (value === 'restart') command = 'shutdown /r /t 60';
        else if (value === 'logout') command = 'shutdown /l';
        else if (value === 'cancel') command = 'shutdown /a';

        if (command) {
            exec(command, (error) => {
                if (error) {
                    res.writeHead(500); res.end(`Error: ${error.message}`);
                    return;
                }
                res.writeHead(200); res.end(`Power action ${value} initiated`);
            });
        }
    }
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log('=========================================');
    console.log(` PAL Bridge Upgrade: FULL FUNCTIONALITY`);
    console.log(` Running at: http://localhost:${PORT}`);
    console.log('=========================================');
});
