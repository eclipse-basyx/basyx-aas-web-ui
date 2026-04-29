const { createServer } = require("./API/api");

const port = 8080;
const server = createServer();

server.listen(port, () => {
    console.log("Backend auf Port " + port);
});