let fs = require("fs");
let os = require("os");

let EventEmitter = require("events");

class Logger extends EventEmitter {
  log(message) {
    this.emit("message", { message });
  }
}

const logger = new Logger();
const logFile = "./eventLog.txt";

const logToFile = (event) => {
  // console.log(event);
  let logMessage = `${new Date().toLocaleString()} - ${event.message} \n`;
  fs.appendFileSync(logFile, logMessage);
};

logger.on("message", logToFile);

setInterval(() => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory; //used memory

  const memoryUsage = (usedMemory / totalMemory) * 100;
  logger.log(`Current memory usage: ${memoryUsage.toFixed(2)}%`);

}, 3000);

logger.log("Application started");
logger.log("Application event occured");
