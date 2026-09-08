const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.send(`
        <h1>Frontend is running successfully 🚀</h1>
        <p>JavaScript frontend running inside Docker.</p>
    `);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend running on port ${PORT}`);
});