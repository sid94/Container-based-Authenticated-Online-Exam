import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';

let port = 8002;

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(model) {
    const app = express();
    app.locals.port = port;
    app.locals.model = model;
    setupRoutes(app);
    app.listen(port, function () {
        console.log(`listening on port ${port}`);
    });
}

function setupRoutes(app) {
    app.use(cors());
    app.use(bodyParser.json());
    //@TODO
    app.get('/', test(app));
    app.post('/questions', createQuestion(app));
    app.get('/questions',listQuestion(app));
    app.get('/score',scoreObtained(app));
    app.use(doErrors());

}

function test(app) {
    return errorWrap(async function (req, res) {
        try {
            res.json({"msg":"yes we did it"})
        }
        catch (err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    })
}

function listQuestion(app) {
    return errorWrap(async function (req, res) {
        try {
            const result =  await app.locals.model.find();
            res.json(result)
        }
        catch (err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    })
}

function createQuestion(app) {
    return errorWrap(async function (req, res) {
        try {
            const obj = req.body;
            const results = await app.locals.model.create(obj);
            res.sendStatus(CREATED);
        }
        catch (err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    })
}

function scoreObtained(app) {
    return errorWrap(async function (req, res) {
        try {
             const val = req.query;
             const result = await app.locals.model.score(val);
             res.json(result);
        }
        catch (err) {
            const mapped = mapError(err);
            res.status(mapped.status).json(mapped);
        }
    })
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */
function doErrors(app) {
    return async function (err, req, res, next) {
        res.status(SERVER_ERROR);
        res.json({ code: 'SERVER_ERROR', message: err.message });
        console.error(err);
    };
}

const ERROR_MAP = {
    EXISTS: CONFLICT,
    NOT_FOUND: NOT_FOUND
}

function mapError(err) {
    console.error(err);
    return err.isDomain
        ? {
            status: (ERROR_MAP[err.errorCode] || BAD_REQUEST),
            code: err.errorCode,
            message: err.message
        }
        : {
            status: SERVER_ERROR,
            code: 'INTERNAL',
            message: err.toString()
        };
}


/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        }
        catch (err) {
            next(err);
        }
    };
}