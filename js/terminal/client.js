/* ****************************************************************
    Create a terminal receiver.
    Currently the server only accepts one connection at a time and
    does not support SSL. If you wish to use to connect to a
    terminal over the internet, PLEASE do not use this class as-is.
        
    --CLIENT--------------------------------------------------------
    
    Client requirements:
            - xterm.js
            - browser with WebSocket support
    Client usage:
        terminalClient = new Terminal({
            parentId: "someid", // ID of the terminal container element
            port: 3000, // 3000 if empty
            host: "127.0.0.1" // Localhost by default
        })
    Client events:
        None.
    Client methods:
        terminalClient.fit() // Resizes the terminal to match the container's size
                      .resize(cols, rows) // Manual resize
    
******************************************************************* */

class TerminalClient {
    constructor(opts) {
        if(!opts.parentId) throw "Missing options";
        
        let sockHost = opts.host || "127.0.0.1";
        let sockPort = opts.port || 3000;

        this.socket = new WebSocket("ws://" + sockHost + ":" + sockPort);
        this.socket.onerror = (e) => {throw e};
        
        this.term = new Terminal({
            cols: 80,
            rows: 24
        });
        this.term.loadAddon(new AttachAddon.AttachAddon(this.socket));
        
        this.fit_addon = new FitAddon.FitAddon();
        this.term.loadAddon(this.fit_addon);

        this.sendSizeToServer = () => {
            let cols = this.term.cols.toString();
            let rows = this.term.rows.toString();
            while (cols.length < 3) {
                cols = "0" + cols;
            }
            while (rows.length < 3) {
                rows = "0" + rows;
            }
            this.socket.send("ESCAPED|-- RESIZE:" + cols + ";" + rows);
        };

        this.term.open(document.getElementById(opts.parentId), true);

        this.fit = () => {
            this.fit_addon.fit();
            setTimeout(() => {
                this.sendSizeToServer();
            }, 50);
        }

        this.resize = (cols, rows) => {
            this.term.resize(cols, rows);
            this.sendSizeToServer();
        }
    }
}
