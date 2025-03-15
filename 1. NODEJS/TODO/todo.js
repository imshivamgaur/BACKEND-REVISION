const fs = require("fs");
const filePath = "./tasks.json";

const command = process.argv[2];
const argument = process.argv[3];

// reading from file
const loadTasks = () => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

// writing to the file or saving
const saveTask = (tasks) => {
  const dataJSON = JSON.stringify(tasks);
  fs.writeFileSync(filePath, dataJSON);
};

// adding tasks in the file
const addTask = (task) => {
  const tasks = loadTasks();
  tasks.push({ id: Date.now(), task });
  saveTask(tasks);
  console.log("task added: ", task);
};

// listing all the task
const listTask = () => {
  const tasks = loadTasks();
  tasks.forEach((e, index) => console.log(`${index + 1} - ${e.task}`));
};

// remove by list number
const removeTask = (index) => {
  let userIndex = index - 1;
  let tasks = loadTasks();
  let filteredTask = tasks.filter((e, index) => index !== userIndex);
  saveTask(filteredTask);
  console.log(`Removed task ${index}`);
};

if (command === "add") {
  addTask(argument);
} else if (command === "list") {
  listTask();
} else if (command === "remove") {
  removeTask(parseInt(argument));
} else {
  console.log("commond not found");
}
