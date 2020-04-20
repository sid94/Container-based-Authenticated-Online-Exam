import serveQuestion from './question-ms.js';
import data from './data.js';


async function go(args) {
    try {
        //const port = getPort(args[0]);
        const questionData = await data.make();
        serveQuestion(questionData);
    }
    catch (err) {
        //hopefully we should never get here.
        console.error(err);
    }
}

go();