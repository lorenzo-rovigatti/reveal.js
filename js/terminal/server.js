/* ****************************************************************
    Create a terminal server.
    Currently the server only accepts one connection at a time and
    does not support SSL. If you wish to use to connect to a
    terminal over the internet, PLEASE do not use this class as-is.

    
    --SERVER-------------------------------------------------------
    
    Server requirements:
        - node-pty
        - ws
    Server usage:
        terminalServer = new Terminal({
            role: "server",
            port: 3000, // 3000 if empty
            shell: "bash"  // Command to run, "bash" by default
        })
    Server events:
        terminalServer.onopened  // Connected to a receiver
                      .ondisconnected  // Disconnected from receiver
                      .onclosed // Terminal was exited
                            // Args: code, signal
                      .onresized // Terminal was resized
                            // Args: cols, rows
    Server methods:
        None.
    
******************************************************************* */

class TerminalServer {
    constructor(opts) {
        this.Pty = require("node-pty");
        this.Websocket = require("ws").Server;

        this.onclosed = () => {};
        this.onopened = () => {};
        this.onresize = () => {};
        this.ondisconnected = () => {};

        this.tty = this.Pty.spawn(opts.shell || "bash", [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.PWD,
            env: process.env
        });

        this.tty.on('exit', (code, signal) => {
            this.onclosed(code, signal);
        });
        this.wss = new this.Websocket({
            port: opts.port || 3000,
            clientTracking: true,
            verifyClient: (info) => {
                if (this.wss.clients.length >= 1) {
                    return false;
                } else {
                    return true;
                }
            }
        });
        this.wss.on('connection', (ws) => {
            this.onopened();
            ws.on('message', (msg) => {
                if (msg.startsWith("ESCAPED|-- ")) {
                    if (msg.startsWith("ESCAPED|-- RESIZE:")) {
                        msg = msg.substr(18);
                        let cols = msg.slice(0, -4);
                        let rows = msg.substr(4);
                        this.tty.resize(Number(cols), Number(rows));
                        this.onresized(cols, rows);
                    }
                } else {
                    this.tty.write(msg);
                }
            });
            this.tty.on('data', (data) => {
                try {
                    ws.send(data);
                } catch (e) {
                    // Websocket closed
                }
            });
        });
        this.wss.on('close', () => {
            this.ondisconnected();
        });
    }
}

module.exports = {
    TerminalServer
};
