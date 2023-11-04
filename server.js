const app = require('./app');
const port = process.env.PORT || 3001;


app.listen(port, () => {
    console.log(`Better Return is running at http://localhost:${port}`);
})