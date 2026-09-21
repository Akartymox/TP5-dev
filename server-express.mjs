import express from "express";
import morgan from "morgan";
import createError from "http-errors";
import logger from "loglevel";

logger.setLevel(logger.levels.DEBUG);

const host = "localhost";
const port = 8000;

const app = express();

// Moteur de template
app.set("view engine", "ejs");

// Morgan en mode développement
if (app.get("env") === "development") {
  app.use(morgan("dev"));
}

// Fichiers statiques (index.html, style.css…)
app.use(express.static("static"));

// Route /random/:nb
app.get("/random/:nb", async function (request, response, next) {
  const length = Number.parseInt(request.params.nb, 10);
  if (Number.isNaN(length)) {
    return next(createError(400));
  }
  const numbers = Array.from({ length }, () => Math.floor(100 * Math.random()));
  const welcome = "Hello";
  return response.render("random", { numbers, welcome });
});

// Handler 404 (aucune route ne correspond)
app.use((request, _response, next) => {
  logger.debug(`default route handler : ${request.url}`);
  return next(createError(404));
});

// Handler d'erreur final
app.use((error, _request, response, _next) => {
  logger.debug(`default error handler: ${error}`);
  const status = error.status ?? 500;
  const stack = app.get("env") === "development" ? error.stack : "";
  const result = { code: status, message: error.message, stack };
  return response.render("error", result);
});

// Démarrage
const server = app.listen(port, host);

server.on("listening", () => {
  logger.info(
    `HTTP listening on http://${server.address().address}:${server.address().port} with mode '${process.env.NODE_ENV}'`
  );
});

logger.info(`File ${import.meta.url} executed.`);
