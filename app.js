const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running On Port 3000");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const changeDateFormat = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    category: item.category,
    priority: item.priority,
    status: item.status,
    dueDate: format(new Date(item.due_date).toISOString(), "yyyy-MM-dd"),
  };
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriorityStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityCategoryProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { category, search_q = "", priority, status } = request.query;

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`;
      break;
    case hasPriorityStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND status = '${status}';`;
      break;
    case hasCategoryStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}' AND status = '${status}';`;
      break;
    case hasPriorityCategoryProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}' AND category = '${category}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodoQuery);
  console.log(data);
  const updatedData = data.map(changeDateFormat);
  response.send(updatedData);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(changeDateFormat(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const getAgendaQuery = `SELECT * FROM todo WHERE due_date = '${date}';`;
  const agendaTodo = await db.all(getAgendaQuery);
  response.send(agendaTodo.map(changeDateFormat));
});

app.post("/todos/", async (request, response) => {
  const todoData = request.body;
  const { id, todo, priority, status, category, dueDate } = todoData;
  const postTodoQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColum = "";
  const updatedBody = request.body;

  switch (true) {
    case updatedBody.status !== undefined:
      updateColum = "Status";
      console.log(updateColum);
      break;
    case updatedBody.priority !== undefined:
      updateColum = "Priority";
      console.log(updateColum);
      break;
    case updatedBody.todo !== undefined:
      updateColum = "Todo";
      console.log(updateColum);
      break;
    case updatedBody.category !== undefined:
      updateColum = "Category";
      console.log(updateColum);
      break;
    case updatedBody.dueDate !== undefined:
      updateColumn = "dueDate";
      break;
  }
  const getPreviousData = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousData = await db.get(getPreviousData);
  const {
    status = previousData.status,
    priority = previousData.priority,
    todo = previousData.todo,
    category = previousData.category,
    dueDate = previousData.dueDate,
  } = request.body;
  const updateTodoQuery = `UPDATE todo SET todo='${todo}', 
  status='${status}',
  priority='${priority}',
  category = '${category}',
  due_date = '${dueDate}';`;
  await db.run(updateTodoQuery);
  response.send(`${updateColum} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
