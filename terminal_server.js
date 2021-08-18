// Server demo (running node.js)

const TerminalServer = require("./js/terminal/server.js").TerminalServer;
let terminalServer = new TerminalServer({
    shell: (process.platform === "win32") ? "cmd.exe" : "bash",
    port: 3000
});

terminalServer.onclosed = (code, signal) => {
    console.log("Terminal closed - " + code + ", " + signal);
    app.quit();
};
terminalServer.onopened = () => {
    console.log("Connected to remote");
};
terminalServer.onresized = (cols, rows) => {
    console.log("Resized terminal to " + cols + "x" + rows);
};
terminalServer.ondisconnected = () => {
    console.log("Remote disconnected");
};
